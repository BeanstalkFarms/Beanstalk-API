/**
 * @typedef {import('../../../types/types').CalcApyOptions} CalcApyOptions
 * @typedef {import('../../../types/types').DepositYieldMap} DepositYieldMap
 */

const { C } = require('../../../constants/runtime-constants');
const { ApyInitType } = require('../../../repository/postgres/models/types/types');
const { fromBigInt } = require('../../../utils/number');

class PreGaugeApyUtil {
  /**
   * Calculates the silo apy before seed gauge was implemented
   * @param {BigInt} beansPerSeason - The provided EMA
   * @param {string[]} tokens (informational) - The token(s) calculating on
   * @param {BigInt[]} seedsPerTokenBdv - The amount of seeds awarded per bdv for the whitelisted token(s) being calculated
   * @param {BigInt} seedsPerBeanBdv - The amount of seeds awarded per bdv for bean deposits
   * @param {BigInt} totalDepositedBdv - Total bdv deposited in the silo
   * @param {BigInt} totalStalk - Total outstanding stalk
   * @param {BigInt} totalSeeds - Total outstanding seeds
   * @param {CalcApyOptions} options - optional configuration
   * @returns {DepositYieldMap}
   */
  static calcApy(
    beansPerSeason,
    tokens,
    seedsPerTokenBdv,
    seedsPerBeanBdv,
    totalDepositedBdv,
    totalStalk,
    totalSeeds,
    options
  ) {
    const PRECISION = C('eth').DECIMALS;

    const duration = options?.duration ?? 8760;

    // Initialization
    beansPerSeason = fromBigInt(beansPerSeason, PRECISION.bdv);
    seedsPerBeanBdv = fromBigInt(seedsPerBeanBdv, PRECISION.bdv);
    totalSeeds = fromBigInt(totalSeeds, PRECISION.seeds, 2);
    totalStalk = fromBigInt(totalStalk, PRECISION.stalk, 0);
    totalDepositedBdv = fromBigInt(totalDepositedBdv, PRECISION.bdv, PRECISION.bdv / 3);
    let userBdv = tokens.map((_) => 1);
    let userStalk = tokens.map(
      (_, idx) =>
        options?.initUserValues?.[idx]?.stalkPerBdv ??
        (options.initType === ApyInitType.AVERAGE
          ? totalStalk / totalDepositedBdv
          : // New deposit starts with 1 stalk
            1)
    );
    let ownership = userStalk.map((u) => u / totalStalk);

    let bdvStart = userBdv.map((b) => b);
    let stalkStart = userStalk.map((s) => s);
    let ownershipStart = ownership.map((o) => o);

    let totalSeeds_i;
    let totalStalk_i;
    let userBdv_i = tokens.map((_) => 0);
    let userStalk_i = tokens.map((_) => 0);

    const STALK_PER_SEED = 0.0001;
    const GROWN_STALK_PER_TOKEN = seedsPerTokenBdv.map((s) => fromBigInt(s, PRECISION.stalk));
    const GROWN_STALK_PER_BEAN = seedsPerBeanBdv / 10000;

    // Simulate minting for the requested duration
    for (let i = 0; i < duration; ++i) {
      totalSeeds_i = totalSeeds + beansPerSeason * seedsPerBeanBdv;
      totalStalk_i = totalStalk + beansPerSeason + STALK_PER_SEED * totalSeeds;
      totalSeeds = totalSeeds_i;
      totalStalk = totalStalk_i;

      for (let t = 0; t < tokens.length; ++t) {
        const newBdv = beansPerSeason * ownership[t];

        userBdv_i[t] = userBdv[t] + newBdv;
        userStalk_i[t] =
          userStalk[t] +
          // Earned stalk
          newBdv +
          // Grown stalk from earned beans that were planted
          (userBdv[t] - bdvStart[t]) * GROWN_STALK_PER_BEAN +
          // Grown stalk from the intial deposit token
          bdvStart[t] * GROWN_STALK_PER_TOKEN[t];
        userBdv[t] = userBdv_i[t];
        userStalk[t] = userStalk_i[t];
        ownership[t] = userStalk_i[t] / totalStalk;
      }
    }
    // Return yields
    return tokens.reduce((result, token, idx) => {
      result[token] = {
        bean: (userBdv[idx] - bdvStart[idx]) / bdvStart[idx],
        stalk: (userStalk[idx] - stalkStart[idx]) / stalkStart[idx],
        ownership: (ownership[idx] - ownershipStart[idx]) / ownershipStart[idx]
      };
      return result;
    }, {});
  }
}

module.exports = PreGaugeApyUtil;
