const { BigNumber } = require("alchemy-sdk");
const { basinSG, gql } = require("../datasources/subgraph-client");
const { getConstantProductPrice } = require("../utils/pool/constant-product");
const BlockUtil = require("../utils/block");
const { calcPoolLiquidityUSD } = require("../utils/pool/liquidity");
const subgraphClient = require("../datasources/subgraph-client");

const ONE_DAY = 60 * 60 * 24;

class CoingeckoService {

  static async getTickers(options = {}) {
    // Determine block
    const block = await BlockUtil.blockForSubgraphFromOptions(basinSG, options);
  
    // Retrieve results from Basin subgraph
    const result = await basinSG(gql`
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
      const poolLiquidity = await calcPoolLiquidityUSD(well.tokens, reservesBN, block.number);
      
      const ticker = {
        ticker_id: `${token0}_${token1}`,
        base_currency: token0,
        target_currency: token1,
        pool_id: well.id,
        last_price: poolPrice.string[0],
        base_volume: null,
        target_volume: null,
        liquidity_in_usd: poolLiquidity.toFixed(0),
        high: null,
        low: null
      };
  
      allTickers.push(ticker);
    }
    return allTickers;
  }

  static async getWellVolume(wellAddress, timestamp, lookback = ONE_DAY) {

    const sgResults = await allPaginatedSG(
      basinSG,
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
      'timestamp',
      (timestamp - lookback).toFixed(0),
      'asc'
    );
    console.log(sgResults);
  }
}

/**
 * Paginates a given subgraph query according to Graph Protocol's GraphQL API spec.
 * Only a single entity type should be requested at a time.
 * 
 * @param {function} subgraphClient 
 * @param {string} query - the query to be paginated
 * @param {string} paginateField - the field to paginate on
 * @param {string} firstValue - the initial value to begin with of the paginateField
 * @param {'asc' | 'desc'} paginateDirection 
 * 
 * TODO: need a terminating condition if desc direction is used
 * 
 * @returns all results matching the query
 */
async function allPaginatedSG(subgraphClient, query, paginateField, firstValue, paginateDirection) {

  const PAGE_SIZE = 1000;
  const whereSuffix = paginateDirection === 'asc' ? '_gt' : '_lt';

  const retval = [];
  while (firstValue) {
    // Construct arguments for pagination
    const paginateArguments = `(where: {${paginateField}${whereSuffix}: "${firstValue}"}, first: ${PAGE_SIZE}, orderBy: ${paginateField}, orderDirection: ${paginateDirection})`
    let entityName = '';
    // Add the generated arguments to the query
    const paginatedQuery = query.replace(/(\w+)\s{/, (match, p1) => {
      entityName = p1;
      return `${entityName} ${paginateArguments} {`;
    });
    const result = await subgraphClient(paginatedQuery);

    // Record the results and repeat as necessary
    retval.push(...result[entityName]);
    firstValue = result[entityName][PAGE_SIZE - 1]?.[paginateField];
  }
  return retval;
}

module.exports = CoingeckoService;
