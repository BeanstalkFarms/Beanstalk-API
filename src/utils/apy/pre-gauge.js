/**
 * @typedef {import('../../../types/types').CalcApysPreGaugeInputs} CalcApysPreGaugeInputs
 * @typedef {import('../../../types/types').TokenApy} TokenApy
 */

/**
 * Calculates the silo apy before seed gauge was implemented
 * @param {CalcApysPreGaugeInputs} params 
 * @returns {TokenApy}
 */
function calcApyPreGauge(params) {

  // TODO: consider using BigNumber
  let { beansPerSeason, seedsPerTokenBdv, seedsPerBeanBdv, totalStalk, totalSeeds } = params;
  const duration = params.duration ?? 8760;

  // Initialization
  beansPerSeason /= Math.pow(10, 6);
  seedsPerTokenBdv /= Math.pow(10, 6);
  seedsPerBeanBdv /= Math.pow(10, 6);
  totalSeeds /= Math.pow(10, 6);
  totalStalk /= Math.pow(10, 10);
  let userBdv = params.initialUserValues ? params.initialUserValues.bdv / Math.pow(10, 6) : 1;
  let userStalk = params.initialUserValues ? params.initialUserValues.stalk / Math.pow(10, 10) : 1;
  let ownership = userStalk / totalStalk;

  let bdvStart = userBdv;
  let stalkStart = userStalk;
  let ownershipStart = ownership;

  let totalSeeds_i;
  let totalStalk_i;
  let userBdv_i;
  let userStalk_i;

  const STALK_PER_SEED = 0.0001;
  const GROWN_STALK_PER_TOKEN = seedsPerTokenBdv / 10000;
  const GROWN_STALK_PER_BEAN = seedsPerBeanBdv / 10000;

  // Simulate minting for the requested duration
  for (let i = 0; i < duration; ++i) {
    ownership = userStalk / totalStalk;
    let newBdv = beansPerSeason * ownership;

    totalSeeds_i = totalSeeds + beansPerSeason * seedsPerBeanBdv;
    totalStalk_i = totalStalk + beansPerSeason + STALK_PER_SEED * totalSeeds;
    userBdv_i = userBdv + newBdv;
    userStalk_i = userStalk + newBdv + GROWN_STALK_PER_BEAN * (userBdv - 1) + GROWN_STALK_PER_TOKEN;

    totalSeeds = totalSeeds_i;
    totalStalk = totalStalk_i;
    userBdv = userBdv_i;
    userStalk = userStalk_i;
  }

  // Return yields
  return {
    token: params.token,
    beanYield: (userBdv - bdvStart) / bdvStart,
    stalkYield: (userStalk - stalkStart) / stalkStart,
    ownershipGrowth: (ownership - ownershipStart) / ownershipStart
  };
}

module.exports = {
  calcApyPreGauge
}
