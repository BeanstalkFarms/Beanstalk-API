const { BEANWSTETH, CP2 } = require('../../constants/addresses');
const ContractGetters = require('../../datasources/contracts/contract-getters');

class WellFnUtil {
  /**
   * Transforms a rate returned from `calcRate` such that its precision is the same as the "i" token.
   * This is not necessary for Stable2.
   * @param {*} rate - The computed rate from `calcRate`
   * @param {*} j - The "j" token used to compute this rate
   * @param {*} decimals - decimal precision of tokens in this well
   */
  static transformRate(rate, wellFnAddr, j, decimals) {
    if (wellFnAddr === CP2) {
      const decimalsToRemove = 18 - decimals[j];
      return rate / BigInt(10 ** decimalsToRemove);
    }
    return rate;
  }

  // Returns adjusted rates from `calcRate` that have precision equivalent to their corresponding token
  static async getRates(reserves, data, wellFnAddr, decimals) {
    const wellFn = await ContractGetters.getWellFunctionContract(wellFnAddr);
    const rates = await Promise.all([
      wellFn.callStatic.calcRate(reserves, 0, 1, data),
      wellFn.callStatic.calcRate(reserves, 1, 0, data)
    ]);
    return [
      WellFnUtil.transformRate(BigInt(rates[0]), wellFnAddr, 1, decimals),
      WellFnUtil.transformRate(BigInt(rates[1]), wellFnAddr, 0, decimals)
    ];
  }

  static async depth(reserves, decimals) {
    const precision = decimals.map((d) => BigInt(10 ** d));

    const rates = await WellFnUtil.getRates(reserves, '0x00', CP2, decimals);

    // const ratio = [rates[0], BigInt(10 ** 18)];
    // const ratio = [(rates[0] * 98n) / 100n, BigInt(10 ** 18)];
    // const ratio = [(rates[0] * 102n) / 100n, BigInt(10 ** 18)];
    // const ratio = [BigInt(10 ** 6), (rates[1] * 102n) / 100n];
    const ratio = [precision[0], (rates[1] * 98n) / 100n];

    const wellFn = await ContractGetters.getWellFunctionContract(CP2);
    const outReserves0 = await wellFn.callStatic.calcReserveAtRatioSwap(reserves, 0, ratio, '0x00');
    const outReserves1 = await wellFn.callStatic.calcReserveAtRatioSwap(reserves, 1, ratio, '0x00');
    return [BigInt(outReserves0), BigInt(outReserves1)];
  }
}

module.exports = WellFnUtil;
