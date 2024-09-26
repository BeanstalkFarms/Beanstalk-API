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
  // Value at index i corresponds to how much of the token at index i is received in exchange
  // for one of token 1 - i.
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

  // Calculates the token volume resulting from a liquidity add operation.
  // This functionality may or may not be helpful within this API project - it is used in subgraphs.
  // However it was first developed here as a means of understanding the inputs/outputs.
  static async calcLiquidityVolume(prevReserves, newReserves) {
    const wellFn = await ContractGetters.getWellFunctionContract(CP2);

    const initialLp = BigInt(await wellFn.callStatic.calcLpTokenSupply(prevReserves, '0x'));
    const newLp = BigInt(await wellFn.callStatic.calcLpTokenSupply(newReserves, '0x'));
    const deltaLp = newLp - initialLp;

    // Determines how much of the liquidity operation was double sided.
    // Can then calculate how much was single sided.
    const doubleSided = (
      await wellFn.callStatic.calcLPTokenUnderlying(BigInt_abs(deltaLp), newReserves, newLp, '0x')
    ).map((bn) => {
      return deltaLp > 0n ? BigInt(bn) : -BigInt(bn);
    });
    const deltaReserves = [newReserves[0] - prevReserves[0], newReserves[1] - prevReserves[1]];
    return [doubleSided[0] - deltaReserves[0], doubleSided[1] - deltaReserves[1]];
  }
}

module.exports = WellFnUtil;
