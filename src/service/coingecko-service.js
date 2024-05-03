const { BigNumber } = require("alchemy-sdk");
const { basinSG, gql } = require("../datasources/subgraph-client");
const { getConstantProductPrice } = require("../utils/constant-product");
const BlockUtil = require("../utils/block");

async function getTickers(options = {}) {
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
    const price = getConstantProductPrice(well.reserves.map(BigNumber.from), well.tokens.map(t => t.decimals));
    const ticker = {
      ticker_id: `${token0}_${token1}`,
      base_currency: token0,
      target_currency: token1,
      pool_id: well.id,
      last_price: price.string[0],
      base_volume: null,
      target_volume: null,
      liquidity_in_usd: null,
      high: null,
      low: null
    };

    allTickers.push(ticker);
  }
  return allTickers;
}

module.exports = {
  getTickers
}
