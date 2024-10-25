const NumberUtil = require('../../../utils/number');

class ConstantProductWellUtil {
  // Retroactive replacement functionality for well function `calcRates` - did not exist in CP2 1.0
  static calcRate(reserves, decimals) {
    if (reserves[0] === 0n || reserves[1] === 0n) {
      return NumberUtil.createNumberSpread([0n, 0n], [decimals[1], decimals[0]]);
    }

    const precision = decimals.map((d) => BigInt(10 ** d));

    const token0Price = (reserves[1] * precision[0]) / reserves[0];
    const token1Price = (reserves[0] * precision[1]) / reserves[1];

    return NumberUtil.createNumberSpread([token0Price, token1Price], [decimals[1], decimals[0]]);
  }

  // DEPRECATED
  // Calculates the requested percent depth from the reserves in the pool.
  // Equation derived by solving a system of equations where x2, y2 are the reserves after buying or selling percent:
  // x1y1 = c,
  // x2y2 = c,
  // x2/y2 = (1 +/- percent)x1/y1
  static deprecated_calcDepth(reserves, decimals, percent = 2) {
    const sqrtPrecision = BigInt(10 ** 15);
    // For negative/positive depths
    const negSqrt = BigInt(Math.round(Math.sqrt((100 - percent) / 100) * Number(sqrtPrecision)));
    const posSqrt = BigInt(Math.round(Math.sqrt((100 + percent) / 100) * Number(sqrtPrecision)));

    // Determine amount of tokens in the pool after would-be transactions of the given percent.
    // Note that the answers for token0 and token1 are not related in the sense that they do not
    // represent valid simultaneous pool reserves. Only the amount of that reserve that would need to
    // be transacted to move its own token price by x%
    const token0AfterSold = (reserves[0] * sqrtPrecision) / negSqrt;
    const token0AfterBought = (reserves[0] * sqrtPrecision) / posSqrt;

    const token1AfterSold = (reserves[1] * sqrtPrecision) / negSqrt;
    const token1AfterBought = (reserves[1] * sqrtPrecision) / posSqrt;

    return {
      buy: NumberUtil.createNumberSpread([reserves[0] - token0AfterBought, reserves[1] - token1AfterBought], decimals),
      sell: NumberUtil.createNumberSpread([token0AfterSold - reserves[0], token1AfterSold - reserves[1]], decimals)
    };
  }
}

module.exports = ConstantProductWellUtil;
