const { BigNumber } = require("alchemy-sdk");
const { asyncPriceV1ContractGetter, asyncUsdOracleContractGetter } = require("../datasources/contracts");
const BlockUtil = require("../utils/block");
const { createNumberSpread } = require("../utils/number");

async function getBeanPrice(options = {}) {
  const block = await BlockUtil.blockFromOptions(options);
  const priceContract = await asyncPriceV1ContractGetter();
  const priceResult = await priceContract.callStatic.price({ blockTag: block.number });

  // Convert from hex to a readable format. For now the pool prices are omitted
  const readable = {
    block: block.number,
    timestamp: block.timestamp,
    price: createNumberSpread(priceResult.price, 6, 4).float,
    liquidityUSD: createNumberSpread(priceResult.liquidity, 6, 2).float,
    deltaB: createNumberSpread(priceResult.deltaB, 6, 0).float,
  };
  return readable;
}

async function getTokenPrice(token, options = {}) {
  const block = await BlockUtil.blockFromOptions(options);
  const usdOracle = await asyncUsdOracleContractGetter();
  const result = await usdOracle.callStatic.getUsdPrice(token, { blockTag: block.number });
  // getUsdPrice returns a twa price, but with no lookback. Its already instantaneous but needs conversion
  const instPrice = BigNumber.from(10).pow(24).div(result);
  
  const readable = {
    block: block.number,
    timestamp: block.timestamp,
    token,
    usdPrice: createNumberSpread(instPrice, 6, 2).float
  };
  return readable;
}

module.exports = {
  getBeanPrice,
  getTokenPrice
}
