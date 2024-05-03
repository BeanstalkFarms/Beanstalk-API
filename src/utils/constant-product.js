const { BigNumber } = require("alchemy-sdk");
const { formatUnits } = require("ethers");
const { createNumberSpread } = require("./number");

// Given the reserves, returns the current price of each token in a constant product pool
// The prices returned are in terms of the other token
function getConstantProductPrice(reserves, decimals) {
  const precision = decimals.map(d => BigNumber.from(10).pow(d));

  const token0Price = reserves[1].mul(precision[0]).div(reserves[0]);
  const token1Price = reserves[0].mul(precision[1]).div(reserves[1]);

  return createNumberSpread([token0Price, token1Price], [decimals[1], decimals[0]]);
}

module.exports = {
  getConstantProductPrice
}
