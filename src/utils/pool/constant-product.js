const { BigNumber } = require("alchemy-sdk");
const NumberUtil = require("../number");
const { TEN_BN } = require("../../constants/constants");

class ConstantProductUtil {
  // Given the reserves, returns the current price of each token in a constant product pool
  // The prices returned are in terms of the other token
  static getConstantProductPrice(reserves, decimals) {
    const precision = decimals.map(d => TEN_BN.pow(d));

    const token0Price = reserves[1].mul(precision[0]).div(reserves[0]);
    const token1Price = reserves[0].mul(precision[1]).div(reserves[1]);

    return NumberUtil.createNumberSpread([token0Price, token1Price], [decimals[1], decimals[0]]);
  }
}

module.exports = ConstantProductUtil;
