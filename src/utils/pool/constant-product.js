const { BigNumber } = require('alchemy-sdk');
const NumberUtil = require('../number');
const { TEN_BN, ZERO_BN } = require('../../constants/constants');

class ConstantProductUtil {
  // Given the reserves, returns the current price of each token in a constant product pool
  // The prices returned are in terms of the other token
  static calcPrice(reserves, decimals) {
    if (ZERO_BN.eq(reserves[0]) || ZERO_BN.eq(reserves[1])) {
      return NumberUtil.createNumberSpread([ZERO_BN, ZERO_BN], [decimals[1], decimals[0]]);
    }

    const precision = decimals.map((d) => TEN_BN.pow(d));

    const token0Price = reserves[1].mul(precision[0]).div(reserves[0]);
    const token1Price = reserves[0].mul(precision[1]).div(reserves[1]);

    return NumberUtil.createNumberSpread([token0Price, token1Price], [decimals[1], decimals[0]]);
  }

  // Calculates the requested percent depth from the reserves in the pool.
  // Equation derived by solving a system of equations where x2, y2 are the reserves after buying or selling percent:
  // x1y1 = c,
  // x2y2 = c,
  // x2/y2 = (1 +/- percent)x1/y1
  static calcDepth(reserves, decimals, percent = 2) {
    const sqrtPrecision = TEN_BN.pow(15);
    const buy0Sqrt = BigNumber.from(Math.round(Math.sqrt((100 - percent) / 100) * Math.pow(10, 15)));
    const sell0Sqrt = BigNumber.from(Math.round(Math.sqrt((100 + percent) / 100) * Math.pow(10, 15)));

    // Determine amount of tokens in the pool after would-be transactions of the given percent
    const token0AfterBought = reserves[0].mul(buy0Sqrt).div(sqrtPrecision);
    const token0AfterSold = reserves[0].mul(sell0Sqrt).div(sqrtPrecision);

    const token1AfterSold = reserves[1].mul(sqrtPrecision).div(buy0Sqrt);
    const token1AfterBought = reserves[1].mul(sqrtPrecision).div(sell0Sqrt);

    return [
      {
        buy: NumberUtil.createNumberSpread(reserves[0].sub(token0AfterBought), decimals[0]),
        sell: NumberUtil.createNumberSpread(token0AfterSold.sub(reserves[0]), decimals[0])
      },
      {
        buy: NumberUtil.createNumberSpread(reserves[1].sub(token1AfterBought), decimals[1]),
        sell: NumberUtil.createNumberSpread(token1AfterSold.sub(reserves[1]), decimals[1])
      }
    ];
  }
}

module.exports = ConstantProductUtil;
