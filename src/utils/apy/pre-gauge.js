/**
 * @typedef {import('../../../types/types').CalcApyOptions} CalcApyOptions
 * @typedef {import('../../../types/types').DepositYield} DepositYield
 */

const { PRECISION } = require('../../constants/constants');
const { fromBigInt } = require('../number');

class PreGaugeApyUtil {
  /**
   * Calculates the silo apy before seed gauge was implemented
   * @param {CalcApysPreGaugeInputs} params
   * @returns {DepositYield}
   */
  /**
   * Calculates the silo apy before seed gauge was implemented
   * @param {BigInt} beansPerSeason - The provided EMA
   * @param {string[]} tokens (informational) - The token(s) calculating on
   * @param {BigInt[]} seedsPerTokenBdv - The amount of seeds awarded per bdv for the whitelisted token(s) being calculated
   * @param {BigInt} seedsPerBeanBdv - The amount of seeds awarded per bdv for bean deposits
   * @param {BigInt} totalStalk - Total outstanding stalk
   * @param {BigInt} totalSeeds - Total outstanding seeds
   * @param {CalcApyOptions} options - optional configuration
   * @returns {DepositYield[]}
   */
  static calcApy(beansPerSeason, tokens, seedsPerTokenBdv, seedsPerBeanBdv, totalStalk, totalSeeds, options) {
    const duration = options?.duration ?? 8760;

    // Initialization
    beansPerSeason = fromBigInt(beansPerSeason, PRECISION.bdv);
    seedsPerBeanBdv = fromBigInt(seedsPerBeanBdv, PRECISION.bdv);
    totalSeeds = fromBigInt(totalSeeds, PRECISION.seeds, 2);
    totalStalk = fromBigInt(totalStalk, PRECISION.stalk, 0);
    let userBdv = tokens.map((_, idx) =>
      options?.initialUserValues ? fromBigInt(options.initialUserValues[idx].bdv, PRECISION.bdv, PRECISION.bdv / 2) : 1
    );
    let userStalk = tokens.map((_, idx) =>
      options?.initialUserValues
        ? fromBigInt(options.initialUserValues[idx].stalk, PRECISION.stalk, PRECISION.stalk / 2)
        : 1
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
        userStalk_i[t] = userStalk[t] + newBdv + GROWN_STALK_PER_BEAN * (userBdv[t] - 1) + GROWN_STALK_PER_TOKEN[t];
        userBdv[t] = userBdv_i[t];
        userStalk[t] = userStalk_i[t];
        ownership[t] = userStalk_i[t] / totalStalk;
      }
    }

    // Return yields
    return tokens.map((token, idx) => ({
      token,
      beanYield: (userBdv[idx] - bdvStart[idx]) / bdvStart[idx],
      stalkYield: (userStalk[idx] - stalkStart[idx]) / stalkStart[idx],
      ownershipGrowth: (ownership[idx] - ownershipStart[idx]) / ownershipStart[idx]
    }));
  }
}

module.exports = PreGaugeApyUtil;
