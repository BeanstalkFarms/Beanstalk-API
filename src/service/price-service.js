const { asyncPriceV1ContractGetter } = require("../datasources/contracts");
const { blockFromOptions } = require("../utils/block");

async function getBeanPrice(options = {}) {
  const block = await blockFromOptions(options);
  const priceContract = await asyncPriceV1ContractGetter();
  const priceResult = await priceContract.callStatic.price({ blockTag: block.number });

  // Convert from hex to a readable format. For now the pool prices are omitted
  const readable = {
    block: block.number,
    timestamp: block.timestamp,
    price: parseFloat((priceResult.price.toNumber() / Math.pow(10, 6)).toFixed(4)),
    liquidityUSD: parseFloat((priceResult.liquidity.toNumber() / Math.pow(10, 6)).toFixed(2)),
    deltaB: parseFloat((priceResult.deltaB.toNumber() / Math.pow(10, 6)).toFixed(0))
  };
  return readable;
}

module.exports = {
  getBeanPrice
}
