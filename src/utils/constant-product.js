const { BigNumber } = require("alchemy-sdk");
const { formatUnits } = require("ethers");

// Given the reserves, returns the current price of each token in a constant product pool
// The prices returned are in terms of the other token
function getConstantProductPrice(reserves, decimals) {
  const precision = decimals.map(d => BigNumber.from(10).pow(d));

  const token0Price = reserves[1].mul(precision[0]).div(reserves[0]);
  const token1Price = reserves[0].mul(precision[1]).div(reserves[1]);

  const token0Formatted = formatUnits(token0Price.toString(), decimals[1]);
  const token1Formatted = formatUnits(token1Price.toString(), decimals[0]);

  return {
    bn: [token0Price, token1Price],
    string: [token0Formatted, token1Formatted],
    float: [parseFloat(token0Formatted), parseFloat(token1Formatted)]
  }
}

module.exports = {
  getConstantProductPrice
}
