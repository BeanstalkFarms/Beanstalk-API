const { BigNumber } = require("alchemy-sdk");
const { basinSG, gql } = require("../datasources/subgraph-client");
const { getConstantProductPrice } = require("../utils/constant-product");

async function getTickers() {
  const result = await basinSG(gql`
    {
      wells {
        id
        tokens {
          id
          decimals
        }
        reserves
      }
    }`
  );
  console.log(JSON.stringify(result));

  const allTickers = [];

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
