const { C } = require('../../../constants/runtime-constants');
const AlchemyUtil = require('../../../datasources/alchemy');
const Contracts = require('../../../datasources/contracts/contracts');
const { BigInt_abs } = require('../../../utils/bigint');

// This functionality may or may not be helpful within this API project - it is used in subgraphs.
// However it was first developed here as a means of understanding the inputs/outputs.
class WellFnUtil {
  // Returns adjusted rates from `calcRate` that have precision equivalent to their corresponding token
  // Value at index i is how much of token i is received in exchange for one of token 1 - i.
  static async getRates(reserves, data, wellFnAddr, decimals) {
    const wellFn = Contracts.get(wellFnAddr);
    const rates = await Promise.all([wellFn.calcRate(reserves, 0, 1, data), wellFn.calcRate(reserves, 1, 0, data)]);
    return [
      WellFnUtil._transformRate(BigInt(rates[0]), wellFnAddr, 1, decimals),
      WellFnUtil._transformRate(BigInt(rates[1]), wellFnAddr, 0, decimals)
    ];
  }

  // Calculates the token volume resulting from a liquidity add operation.
  static async calcLiquidityVolume(well, prevReserves, newReserves, c = C()) {
    const wellFn = Contracts.get(well.wellFunction.id, c);
    const data = well.wellFunction.data;

    const initialLp = await wellFn.calcLpTokenSupply(prevReserves, data);
    const newLp = await wellFn.calcLpTokenSupply(newReserves, data);
    const deltaLp = newLp - initialLp;

    // Determines how much of the liquidity operation was double sided.
    // Can then calculate how much was single sided.
    const deltaReserves = [newReserves[0] - prevReserves[0], newReserves[1] - prevReserves[1]].map(BigInt_abs);
    if (deltaLp > 0n) {
      // Add liquidity
      const doubleSided = (await wellFn.calcLPTokenUnderlying(BigInt_abs(deltaLp), newReserves, newLp, data)).map(
        BigInt
      );
      return [doubleSided[0] - deltaReserves[0], doubleSided[1] - deltaReserves[1]];
    } else {
      // Remove liquidity
      const doubleSided = (await wellFn.calcLPTokenUnderlying(BigInt_abs(deltaLp), prevReserves, initialLp, data)).map(
        BigInt
      );
      return [deltaReserves[0] - doubleSided[0], deltaReserves[1] - doubleSided[1]];
    }
  }

  /**
   * Transforms a rate returned from `calcRate` such that its precision is the same as the "i" token.
   * This is not necessary for Stable2.
   * @param {*} rate - The computed rate from `calcRate`
   * @param {*} j - The "j" token used to compute this rate
   * @param {*} decimals - decimal precision of tokens in this well
   */
  static _transformRate(rate, wellFnAddr, j, decimals) {
    if (wellFnAddr === C().CP2 || wellFnAddr === C().CP2_121) {
      const decimalsToRemove = 18 - decimals[j];
      return rate / BigInt(10 ** decimalsToRemove);
    }
    return rate;
  }
}

module.exports = WellFnUtil;

if (require.main === module) {
  (async () => {
    await AlchemyUtil.ready('eth');

    const result = await WellFnUtil.calcLiquidityVolume(
      {
        wellFunction: {
          id: C('eth').CP2,
          data: '0x'
        }
      },
      [3000n * BigInt(10 ** 6), 10n * BigInt(10 ** 18)],
      [1500n * BigInt(10 ** 6), 9n * BigInt(10 ** 18)],
      C('eth')
    );
    console.log(result);

    const result1 = await WellFnUtil.calcLiquidityVolume(
      {
        wellFunction: {
          id: C('eth').CP2,
          data: '0x'
        }
      },
      [1500n * BigInt(10 ** 6), 1n * BigInt(10 ** 18)],
      [3000n * BigInt(10 ** 6), 1n * BigInt(10 ** 18)],
      C('eth')
    );
    console.log(result1);
  })();
}
