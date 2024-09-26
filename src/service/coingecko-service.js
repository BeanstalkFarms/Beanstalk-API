const SubgraphClients = require('../datasources/subgraph-client');
const BlockUtil = require('../utils/block');
const { calcPoolLiquidityUSD } = require('../utils/pool/liquidity');
const { createNumberSpread } = require('../utils/number');
const ConstantProductWellUtil = require('../utils/pool/constant-product');
const BasinSubgraphRepository = require('../repository/subgraph/basin-subgraph');
const { runBatchPromises } = require('../utils/batch-promise');

const ONE_DAY = 60 * 60 * 24;

class CoingeckoService {
  static async getTickers(options = {}) {
    // Determine block
    const block = await BlockUtil.blockForSubgraphFromOptions(SubgraphClients.basinSG, options);

    // Retrieve results from Basin subgraph
    const allWells = await BasinSubgraphRepository.getAllWells(block.number);

    // For each well in the subgraph, construct a formatted response
    const batchPromiseGenerators = [];
    for (const well of allWells) {
      batchPromiseGenerators.push(async () => {
        // Filter pools having < 1k liquidity
        const poolLiquidity = await calcPoolLiquidityUSD(well.tokens, well.reserves, block.number);
        if (poolLiquidity < 1000) {
          return;
        }

        const token0 = well.tokens[0].id;
        const token1 = well.tokens[1].id;

        const poolPrice = well.tokenPrice; // TODO

        const depth2 = ConstantProductWellUtil.calcDepth(
          well.reserves,
          well.tokens.map((t) => t.decimals),
          2
        );
        const [pool24hVolume, priceRange] = await Promise.all([
          CoingeckoService.get24hVolume(well.id, block.number),
          CoingeckoService.getWellPriceRange(well.id, well.tokens, well.reserves, block.timestamp)
        ]);

        const ticker = {
          ticker_id: `${token0}_${token1}`,
          base_currency: token0,
          target_currency: token1,
          pool_id: well.id,
          last_price: poolPrice.float[0],
          base_volume: pool24hVolume.float[0],
          target_volume: pool24hVolume.float[1],
          liquidity_in_usd: parseFloat(poolLiquidity.toFixed(0)),
          depth2: {
            buy: depth2.buy.float,
            sell: depth2.sell.float
          },
          high: priceRange.high.float[0],
          low: priceRange.low.float[0]
        };
        return ticker;
      });
    }

    // Execute the above promises. Note that subgraph rate limit can become an issue as more whitelisted pools exist.
    // This can be improved by combining many of the separated queries together, or caching results in a database
    const results = await runBatchPromises(batchPromiseGenerators, 50);
    return results.filter((ticker) => ticker != null);
  }

  static async getTrades(options) {
    // Find the well matching the requested ticker
    const tokens = options.ticker_id.split('_');
    const wells = await BasinSubgraphRepository.getWellsForPair(tokens);

    // Retrieve swaps matching the criteria
    const limit = Math.min(options.limit, 1000);
    const swaps = await BasinSubgraphRepository.getSwaps(
      wells.map((w) => w.id),
      options.start_time,
      options.end_time,
      limit
    );

    // Format the response
    const retval = {
      buy: [],
      sell: []
    };
    for (const swap of swaps) {
      const type = swap.fromToken.id === tokens[0] ? 'sell' : 'buy';
      retval[type].push({
        trade_id: swap.blockNumber * 10000 + swap.logIndex,
        price: swap.tokenPrice, // TODO
        base_volume: createNumberSpread(swap.amountIn, swap.fromToken.decimals).float,
        target_volume: createNumberSpread(swap.amountOut, swap.toToken.decimals).float,
        trade_timestamp: parseInt(swap.timestamp) * 1000,
        type: type
      });
    }

    if (options.type) {
      // One of buy/sell was explicitly requested
      return {
        [options.type]: retval[options.type]
      };
    }
    return retval;
  }

  // Gets the 24h volume in usd and in terms of the tokens in the well
  static async get24hVolume(wellAddress, blockNumber) {
    // Retrieves the rolling 24h volume from the subgraph.
    // CoinGecko expects volume to be presented in equal proportion on both tokens.
    // i.e. if there is $50k volume, it expects something like 50k BEAN and 15 ETH to be reported
    const rollingVolume = await BasinSubgraphRepository.getRollingVolume(wellAddress, blockNumber);
    return createNumberSpread(
      rollingVolume.map((v) => v.amount),
      rollingVolume.map((v) => v.decimals)
    );
  }

  /**
   * Gets the high/low over the given time range
   * @param {string} wellAddress - address of the well
   * @param {object[]} wellTokens - tokens in the well and their decimals
   * @param {BigInt[]} endReserves - reserves in the well at `timestamp`
   * @param {number} timestamp - the upper bound timestamp
   * @param {number} lookback - amount of time to look in the past
   * @returns high/low price over the given time period, in terms of the underlying tokens
   *
   * In practice it is more performant to calculate the reserves in reverse from known reserves at `timestamp`,
   * since in most cases we are calculating a price range in the past 24h, and the current block is known.
   * If an older timestamp is desired, prior to calling this method, the block/reserves for that timestamp
   * will need to be computed as well, which is a longer operation.
   */
  static async getWellPriceRange(wellAddress, wellTokens, endReserves, timestamp, lookback = ONE_DAY) {
    // Retrieve relevant events
    const [allSwaps, allDeposits, allWithdraws] = await Promise.all([
      BasinSubgraphRepository.getAllSwaps(wellAddress, timestamp - lookback, timestamp),
      BasinSubgraphRepository.getAllDeposits(wellAddress, timestamp - lookback, timestamp),
      BasinSubgraphRepository.getAllWithdraws(wellAddress, timestamp - lookback, timestamp)
    ]);

    // Aggregate all into one list. Initial entry with big timestamp to also consider the current price.
    const aggregated = [
      {
        0: 0n,
        1: 0n,
        timestamp: 5000000000000
      }
    ];
    for (const swap of allSwaps) {
      aggregated.push({
        [wellTokens.findIndex((t) => t.id === swap.fromToken.id)]: swap.amountIn,
        [wellTokens.findIndex((t) => t.id === swap.toToken.id)]: -swap.amountOut,
        timestamp: swap.timestamp
      });
    }

    const addLiquidityEvents = (arr, neg) => {
      for (const liqEvent of arr) {
        const normalized = {
          timestamp: liqEvent.timestamp
        };
        for (let i = 0; i < wellTokens.length; ++i) {
          normalized[i] = neg ? -liqEvent.reserves[i] : liqEvent.reserves[i];
        }
        aggregated.push(normalized);
      }
    };
    addLiquidityEvents(allDeposits, false);
    addLiquidityEvents(allWithdraws, true);

    aggregated.sort((a, b) => b.timestamp - a.timestamp);

    // Track the running reserves and prices
    const runningReserves = [...endReserves];
    const tokenPrices = [];
    for (const event of aggregated) {
      for (let i = 0; i < runningReserves.length; ++i) {
        runningReserves[i] = runningReserves[i] - event[i.toString()];
      }
      // Calculate current price
      const price = event.tokenPrice; // TODO
      price.reserves = [...runningReserves];
      tokenPrices.push(price);
    }

    // Return the min/max token price from the perspective of token0
    return {
      high: tokenPrices.reduce((max, obj) => (obj.float[0] > max.float[0] ? obj : max), tokenPrices[0]),
      low: tokenPrices.reduce((min, obj) => (obj.float[0] < min.float[0] ? obj : min), tokenPrices[0])
    };
  }

  /// Deprecated in favor of using the precomputed 24h rolling volumes from the subgraph
  // Gets the swap volume in terms of token amounts in the well over the requested period
  static async deprecated_calcWellSwapVolume(wellAddress, timestamp, lookback = ONE_DAY) {
    const allSwaps = await BasinSubgraphRepository.getAllSwaps(wellAddress, timestamp - lookback, timestamp);

    if (allSwaps.length === 0) {
      return createNumberSpread([0n, 0n], [1, 1]);
    }

    // Add all of the swap amounts for each token
    const swapVolume = {};
    for (const swap of allSwaps) {
      swapVolume[swap.fromToken.id] = (swapVolume[swap.fromToken.id] ?? 0n) + swap.amountIn;
      swapVolume[swap.toToken.id] = (swapVolume[swap.toToken.id] ?? 0n) + swap.amountOut;
    }

    const decimals = {
      [allSwaps[0].fromToken.id]: allSwaps[0].fromToken.decimals,
      [allSwaps[0].toToken.id]: allSwaps[0].toToken.decimals
    };
    // Convert to the appropriate precision
    for (const token in swapVolume) {
      swapVolume[token] = createNumberSpread(swapVolume[token], decimals[token]);
    }
    return swapVolume;
  }
}

module.exports = CoingeckoService;
