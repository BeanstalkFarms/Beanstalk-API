const Contracts = require('../../../datasources/contracts/contracts');
const PriceService = require('../../price-service');
const NumberUtil = require('../../../utils/number');
const { BigInt_applyPercent } = require('../../../utils/bigint');

class LiquidityUtil {
  // Calculates the current usd liquidity for a pool having these tokens and reserves
  static async calcWellLiquidityUSD(well, blockNumber) {
    let totalLiquidity = 0;
    for (let i = 0; i < well.tokens.length; ++i) {
      const tokenPrice = await PriceService.getTokenPrice(well.tokens[i].address, { blockNumber });
      const tokenCount = NumberUtil.createNumberSpread(well.reserves.raw[i], well.tokens[i].decimals);
      totalLiquidity += tokenPrice.usdPrice * tokenCount.float;
    }
    return totalLiquidity;
  }

  /**
   * Calculates the liquidity depth if a trade were to occur that would move the price by `percent`
   * @param {WellDto} well - contains information about the current reserves, rates, etc
   * @param {*} percent (defualt 2) - the percent for which to calculate depth
   * @returns buy/sell depth in terms of each token
   */
  static async calcDepth(well, percent = 2) {
    const [reserves, rates, decimals] = [well.reserves.raw, well.rates.raw, well.tokenDecimals()];
    const oneToken = decimals.map((d) => BigInt(10 ** d));

    const ratesBuy0 = [BigInt_applyPercent(rates[0], 100 + percent), oneToken[1]];
    const ratesBuy1 = [oneToken[0], BigInt_applyPercent(rates[1], 100 + percent)];
    const ratesSell0 = [BigInt_applyPercent(rates[0], 100 - percent), oneToken[1]];
    const ratesSell1 = [oneToken[0], BigInt_applyPercent(rates[1], 100 - percent)];

    const wellFn = Contracts.getWellFunction(well.wellFunction.id);
    const data = well.wellFunction.data;
    const [reserve1Buy0, reserve0Buy1, reserve1Sell0, reserve0Sell1] = (
      await Promise.all([
        wellFn.calcReserveAtRatioSwap(reserves, 1, ratesBuy0, data),
        wellFn.calcReserveAtRatioSwap(reserves, 0, ratesBuy1, data),
        wellFn.calcReserveAtRatioSwap(reserves, 1, ratesSell0, data),
        wellFn.calcReserveAtRatioSwap(reserves, 0, ratesSell1, data)
      ])
    ).map(BigInt);

    return {
      buy: NumberUtil.createNumberSpread([reserves[0] - reserve0Buy1, reserves[1] - reserve1Buy0], decimals),
      sell: NumberUtil.createNumberSpread([reserve0Sell1 - reserves[0], reserve1Sell0 - reserves[1]], decimals)
    };
  }
}

module.exports = LiquidityUtil;
