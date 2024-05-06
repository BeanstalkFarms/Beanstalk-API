const { BigNumber } = require("alchemy-sdk");
const { gql } = require("../datasources/subgraph-client");
const SubgraphClients = require("../datasources/subgraph-client");
const { getConstantProductPrice } = require("../utils/pool/constant-product");
const BlockUtil = require("../utils/block");
const { calcPoolLiquidityUSD } = require("../utils/pool/liquidity");
const SubgraphQueryUtil = require("../utils/subgraph-query");
const { createNumberSpread } = require("../utils/number");

const ONE_DAY = 60 * 60 * 24;

class CoingeckoService {

  static async getTickers(options = {}) {
    // Determine block
    const block = await BlockUtil.blockForSubgraphFromOptions(SubgraphClients.basinSG, options);
  
    // Retrieve results from Basin subgraph
    const result = await SubgraphClients.basinSG(gql`
      {
        wells(block: {number: ${block.number}}) {
          id
          tokens {
            id
            decimals
          }
          reserves
        }
      }`
    );
  
    const allTickers = [];
  
    // For each well in the subgraph, construct a formatted response
    for (const well of result.wells) {

      const token0 = well.tokens[0].id;
      const token1 = well.tokens[1].id;

      const reservesBN = well.reserves.map(BigNumber.from);
      const poolPrice = getConstantProductPrice(reservesBN, well.tokens.map(t => t.decimals));
      // TODO: improve this with promise.all
      const poolLiquidity = await calcPoolLiquidityUSD(well.tokens, reservesBN, block.number);
      const pool24hVolume = await CoingeckoService.getWellVolume(well.id, block.timestamp);
      
      const ticker = {
        ticker_id: `${token0}_${token1}`,
        base_currency: token0,
        target_currency: token1,
        pool_id: well.id,
        last_price: poolPrice.string[0],
        base_volume: pool24hVolume[token0].string,
        target_volume: pool24hVolume[token1].string,
        liquidity_in_usd: poolLiquidity.toFixed(0),
        high: null,
        low: null
      };
  
      allTickers.push(ticker);
    }
    return allTickers;
  }

  // Gets the swap volume in terms of token amounts in the well
  static async getWellVolume(wellAddress, timestamp, lookback = ONE_DAY) {

    const allSwaps = await SubgraphQueryUtil.allPaginatedSG(
      SubgraphClients.basinSG,
      gql`
      {
        swaps {
          amountIn
          amountOut
          fromToken {
            id
            decimals
          }
          toToken {
            decimals
            id
          }
          timestamp
        }
      }`,
      `well: "${wellAddress}", timestamp_lte: "${timestamp}"`,
      'timestamp',
      (timestamp - lookback).toFixed(0),
      'asc'
    );
    allSwaps.map((swap) => {
      swap.amountIn = BigNumber.from(swap.amountIn);
      swap.amountOut = BigNumber.from(swap.amountOut);
    });

    if (allSwaps.length === 0) {
      return createNumberSpread([BigNumber.from(0), BigNumber.from(0)], [1, 1]);
    }
    
    // Add all of the swap amounts for each token
    const swapVolume = {};
    for (const swap of allSwaps) {
      swapVolume[swap.fromToken.id] = swapVolume[swap.fromToken.id]?.add(swap.amountIn) ?? swap.amountIn;
      swapVolume[swap.toToken.id] = swapVolume[swap.toToken.id]?.add(swap.amountOut) ?? swap.amountOut;
    }

    const decimals = {
      [allSwaps[0].fromToken.id]: allSwaps[0].fromToken.decimals,
      [allSwaps[0].toToken.id]: allSwaps[0].toToken.decimals,
    };
    // Convert to the appropriate precision
    for (const token in swapVolume) {
      swapVolume[token] = createNumberSpread(swapVolume[token], decimals[token]);
    }
    return swapVolume;
  }
}

module.exports = CoingeckoService;
