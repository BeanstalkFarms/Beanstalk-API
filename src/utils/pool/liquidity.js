const { CP2 } = require('../../constants/addresses');
const ContractGetters = require('../../datasources/contracts/contract-getters');
const PriceService = require('../../service/price-service');
const NumberUtil = require('../number');
const { BigInt_applyPercent } = require('../bigint');
const { createNumberSpread } = require('../number');

class LiquidityUtil {
  // Calculates the current usd liquidity for a pool having these tokens and reserves
  static async calcPoolLiquidityUSD(tokens, reserves, blockNumber) {
    let totalLiquidity = 0;
    for (let i = 0; i < tokens.length; ++i) {
      const tokenPrice = await PriceService.getTokenPrice(tokens[i].id, { blockNumber });
      const tokenCount = createNumberSpread(reserves[i], tokens[i].decimals);
      totalLiquidity += tokenPrice.usdPrice * tokenCount.float;
    }
    return totalLiquidity;
  }

  // TODO: consider accepting a Well object that can encapsulate reserves, rates, decimals, and the well function.
  /**
   * Calculates the liquidity depth if a trade were to occur that would move the price by `percent`
   * @param {*} reserves - current well reserves
   * @param {*} rates - current token exchange rates
   * @param {*} decimals - decimal precision for each token
   * @param {*} percent (defualt 2) - the percent for which to calculate depth
   * @returns buy/sell depth in terms of each token
   */
  static async depth(reserves, rates, decimals, percent = 2) {
    const oneToken = decimals.map((d) => BigInt(10 ** d));

    const ratesBuy0 = [BigInt_applyPercent(rates[0], 100 + percent), oneToken[1]];
    const ratesBuy1 = [oneToken[0], BigInt_applyPercent(rates[1], 100 + percent)];
    const ratesSell0 = [BigInt_applyPercent(rates[0], 100 - percent), oneToken[1]];
    const ratesSell1 = [oneToken[0], BigInt_applyPercent(rates[1], 100 - percent)];

    const wellFn = await ContractGetters.getWellFunctionContract(CP2); // TODO: well fn
    const [reserve1Buy0, reserve0Buy1, reserve1Sell0, reserve0Sell1] = (
      await Promise.all([
        wellFn.callStatic.calcReserveAtRatioSwap(reserves, 1, ratesBuy0, '0x00'),
        wellFn.callStatic.calcReserveAtRatioSwap(reserves, 0, ratesBuy1, '0x00'),
        wellFn.callStatic.calcReserveAtRatioSwap(reserves, 1, ratesSell0, '0x00'),
        wellFn.callStatic.calcReserveAtRatioSwap(reserves, 0, ratesSell1, '0x00')
      ])
    ).map(BigInt);

    return {
      buy: NumberUtil.createNumberSpread([reserves[0] - reserve0Buy1, reserves[1] - reserve1Buy0], decimals),
      sell: NumberUtil.createNumberSpread([reserve0Sell1 - reserves[0], reserve1Sell0 - reserves[1]], decimals)
    };
  }
}

module.exports = LiquidityUtil;
