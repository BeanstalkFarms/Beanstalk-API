const SubgraphClients = require('../datasources/subgraph-client');
const BlockUtil = require('../utils/block');
const { createNumberSpread } = require('../utils/number');
const ConstantProductWellUtil = require('../utils/pool/constant-product');
const BasinSubgraphRepository = require('../repository/subgraph/basin-subgraph');
const { runBatchPromises } = require('../utils/batch-promise');
const LiquidityUtil = require('../utils/pool/liquidity');
const NumberUtil = require('../utils/number');

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
        const poolLiquidity = await LiquidityUtil.calcWellLiquidityUSD(well, block.number);
        if (poolLiquidity < 1000) {
          return;
        }

        const [base_currency, target_currency] = well.tokens.map((t) => t.address);

        const depth2 = await LiquidityUtil.calcDepth(well, 2);
        const priceRange = await CoingeckoService.getWellPriceRange(well, block.timestamp);

        const ticker = {
          ticker_id: `${base_currency}_${target_currency}`,
          base_currency,
          target_currency,
          pool_id: well.address,
          last_price: well.rates.float[1],
          base_volume: well.biTokenVolume24h.float[0],
          target_volume: well.biTokenVolume24h.float[1],
          liquidity_in_usd: parseFloat(poolLiquidity.toFixed(0)),
          depth2: {
            buy: depth2.buy.float,
            sell: depth2.sell.float
          },
          high: priceRange.high.float[1],
          low: priceRange.low.float[1]
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
    // Retrieve swaps matching the criteria
    const tokens = options.ticker_id.split('_');
    const swaps = await BasinSubgraphRepository.getWellSwapsForPair(
      tokens,
      options.start_time,
      options.end_time,
      Math.min(options.limit, 1000)
    );

    // Format the response
    const retval = {
      buy: [],
      sell: []
    };
    for (const swap of swaps) {
      const type = swap.fromToken.id === tokens[0] ? 'sell' : 'buy';
      const effectivePrice = (swap.amountOut * BigInt(10 ** swap.fromToken.decimals)) / swap.amountIn;
      retval[type].push({
        trade_id: swap.blockNumber * 10000 + swap.logIndex,
        price: createNumberSpread(effectivePrice, swap.toToken.decimals).float,
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

  /**
   * Gets the high/low over the given time range
   * @param {WellDto} well - the well dto
   * @param {number} timestamp - the upper bound timestamp
   * @param {number} lookback - amount of time to look in the past
   * @returns high/low price over the given time period, in terms of the underlying tokens
   */
  static async getWellPriceRange(well, timestamp, lookback = ONE_DAY) {
    // Retrieves history of token exchange rates over the requested period
    const allPriceChangeEvents = await Promise.all([
      BasinSubgraphRepository.getAllSwaps(well.address, timestamp - lookback, timestamp),
      BasinSubgraphRepository.getAllDeposits(well.address, timestamp - lookback, timestamp),
      BasinSubgraphRepository.getAllWithdraws(well.address, timestamp - lookback, timestamp)
    ]);

    const flattened = allPriceChangeEvents
      .reduce((acc, next) => {
        acc.push(...next);
        return acc;
      }, [])
      .map((event) => NumberUtil.createNumberSpread(event.tokenPrice, well.tokenDecimals()));

    if (flattened.length === 0) {
      // No trading activity over this period, returns the current rates
      return {
        high: well.rates,
        low: well.rates
      };
    }

    // Return the min/max token price from the perspective of token0.
    // The maximal value of token0 is when fewer of its tokens can be bought with token1
    return {
      high: flattened.reduce((max, obj) => (obj.float[0] < max.float[0] ? obj : max), flattened[0]),
      low: flattened.reduce((min, obj) => (obj.float[0] > min.float[0] ? obj : min), flattened[0])
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
      swapVolume[swap.fromToken.id] = (swapVolume[swap.fromToken.id] ?? 0n) + BigInt(swap.amountIn);
      swapVolume[swap.toToken.id] = (swapVolume[swap.toToken.id] ?? 0n) + BigInt(swap.amountOut);
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
