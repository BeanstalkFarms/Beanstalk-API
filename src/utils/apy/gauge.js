/**
 * @typedef {import('../../../types/types').CalcApyOptions} CalcApyOptions
 * @typedef {import('../../../types/types').DepositYield} DepositYield
 */

const { toBigInt } = require('ethers');
const { PRECISION } = require('../../constants/constants');
const { fromBigInt } = require('../number');

class GaugeApyUtil {
  /**
   * Calculates silo Bean/Stalk vAPY when Seed Gauge is active.
   *
   * All of the array parameters should not be empty and be the same length, with one entry for every gauge lp deposit type
   *
   * @param {BigInt} beansPerSeason - The provided EMA
   * @param {string[]} tokenNames (informational) - The token(s) calculating on
   * @param {number[]} tokens - Which tokens to calculate the apy for. For a gauge lp token,
   *        provide an index corresponding to the position of that lp in the other array parameters.
   *        For Bean, provide -1. For a non-gauge token, provide -2. See staticSeeds parameter below
   * @param {BigInt[]} gaugeLpPoints - Array of gauge points assigned to each gauge lp. With a single lp, there will be one entry
   * @param {BigInt[]} gaugeLpDepositedBdv - Array of deposited bdv corresponding to each gauge lp
   * @param {BigInt} nonGaugeDepositedBdv - Amount of (whitelisted) deposited bdv that is not tracked by the gauge system
   * @param {BigInt[]} gaugeLpOptimalPercentBdv - Array of optimal bdv percentages for each lp
   * @param {BigInt} initialR - Initial ratio of max LP gauge points per bdv to Bean gauge points per bdv
   * @param {BigInt} siloDepositedBeanBdv - The total number of Beans in the silo
   * @param {BigInt} siloStalk - The total amount of stalk in the silo
   *
   * GERMINATING PARAMS - First index corresponds to Even germinating, second index is Odd.
   *
   * @param {number} season - The current season, required for germinating.
   * @param {BigInt} germinatingBeanBdv - Germinating beans bdv
   * @param {BigInt[][]} gaugeLpGerminatingBdv - Germinating bdv of each gauge lp. Each outer array entry corresponds to one lp
   * @param {BigInt[]} nonGaugeGerminatingBdv - Germinating bdv of all non-gauge whitelisted assets
   *
   * UNRIPE
   *
   * @param {Array<BigInt | null>} staticSeeds - Provided when `token` does not have its seeds dynamically changed by gauge
   *
   * OTHER
   *
   * @param {CalcApyOptions} options - optional configuration
   *
   * Future work includes improvement of the `r` value simulation. This involves using Beanstalk's current state,
   * including L2SR and debt level (temperature cases). Also can be improved by tracking an expected ratio of
   * seasons with mints to seasons without mints. This will allow for a more accurate simulation of its fluctuation.
   *
   * @returns {DepositYield}
   */
  static calcApy(
    beansPerSeason,
    tokenNames,
    tokens,
    gaugeLpPoints,
    gaugeLpDepositedBdv,
    nonGaugeDepositedBdv,
    gaugeLpOptimalPercentBdv,
    initialR,
    siloDepositedBeanBdv,
    siloStalk,
    season,
    germinatingBeanBdv,
    gaugeLpGerminatingBdv,
    nonGaugeGerminatingBdv,
    staticSeeds,
    options
  ) {
    const catchUpRate = options?.duration ?? 8760;
    const duration = options?.duration ?? 8760;

    // Current LP GP allocation per BDV
    const lpGpPerBdv = [];
    // Transform these inputs
    const gaugeLpPointsCopy = [];
    const gaugeLpDepositedBdvCopy = [];
    const gaugeLpOptimalPercentBdvCopy = [];
    for (let i = 0; i < gaugeLpPoints.length; ++i) {
      const points = fromBigInt(gaugeLpPoints[i], PRECISION.gaugePoints, PRECISION.gaugePoints / 3);
      const bdv = fromBigInt(gaugeLpDepositedBdv[i], PRECISION.bdv, PRECISION.bdv / 3);
      lpGpPerBdv.push(points / bdv);
      gaugeLpPointsCopy.push(points);
      gaugeLpDepositedBdvCopy.push(bdv);
      gaugeLpOptimalPercentBdvCopy.push(fromBigInt(gaugeLpOptimalPercentBdv[i], PRECISION.optimalPercentDepositedBdv));
    }

    // Current percentages allocations of each LP
    const currentPercentLpBdv = [];
    const sumLpBdv = Math.sum(gaugeLpDepositedBdvCopy);
    for (let i = 0; i < gaugeLpDepositedBdvCopy.length; ++i) {
      currentPercentLpBdv.push(gaugeLpDepositedBdvCopy[i] / sumLpBdv);
    }

    let r = fromBigInt(initialR, PRECISION.beanToMaxLpGpPerBdvRatio, PRECISION.beanToMaxLpGpPerBdvRatio / 2);
    const siloReward = fromBigInt(beansPerSeason, PRECISION.bdv, PRECISION.bdv);
    let beanBdv = fromBigInt(siloDepositedBeanBdv, PRECISION.bdv, PRECISION.bdv / 3);
    let totalStalk = fromBigInt(siloStalk, PRECISION.stalk, 0);
    let gaugeBdv = beanBdv + Math.sum(gaugeLpDepositedBdvCopy);
    let nonGaugeDepositedBdv_ = fromBigInt(nonGaugeDepositedBdv, PRECISION.bdv, PRECISION.bdv / 3);
    let totalBdv = gaugeBdv + nonGaugeDepositedBdv_;
    let largestLpGpPerBdv = Math.max(lpGpPerBdv);

    // TODO: use options here for initial state
    const startingGrownStalk = totalStalk / totalBdv - 1;
    const userBeans = [];
    const userLp = [];
    const userStalk = [];
    for (let i = 0; i < tokens.length; ++i) {
      userBeans.push(tokens[i] === -1 ? 1 : 0);
      userLp.push(tokens[i] === -1 ? 0 : 1);
      // Initial stalk from deposit + avg grown stalk
      userStalk.push(1 + startingGrownStalk);
    }

    // TODO: seed precision?
    for (let i = 0; i < duration; ++i) {
      r = GaugeApyUtil.#updateR(r, GaugeApyUtil.#deltaRFromState(beansPerSeason));
      const rScaled = GaugeApyUtil.#scaleR(r);

      // Add germinating bdv to actual bdv in the first 2 simulated seasons
      if (i < 2) {
        const index = season % 2 == 0 ? 1 : 0;
        beanBdv += fromBigInt(germinatingBeanBdv[index], PRECISION.bdv, PRECISION.bdv / 3);
        for (let j = 0; j < gaugeLpDepositedBdvCopy.length; ++j) {
          gaugeLpDepositedBdvCopy[j] += fromBigInt(gaugeLpGerminatingBdv[j][index], PRECISION.bdv, PRECISION.bdv / 3);
        }
        gaugeBdv = beanBdv + Math.sum(gaugeLpDepositedBdvCopy);
        nonGaugeDepositedBdv_ += fromBigInt(nonGaugeGerminatingBdv[index], PRECISION.bdv, PRECISION.bdv / 3);
        totalBdv = gaugeBdv + nonGaugeDepositedBdv_;
      }

      // Handle multiple whitelisted gauge LP
      if (gaugeLpPoints.length > 1) {
        for (let j = 0; j < gaugeLpDepositedBdvCopy.length; ++i) {
          gaugeLpPointsCopy[j] = GaugeApyUtil.#updateGaugePoints(
            gaugeLpPointsCopy[j],
            currentPercentLpBdv[j],
            gaugeLpOptimalPercentBdvCopy[j]
          );
          lpGpPerBdv[j] = gaugeLpPointsCopy[j] / gaugeLpDepositedBdvCopy[j];
        }
        largestLpGpPerBdv = Math.max(lpGpPerBdv);
      }

      const beanGpPerBdv = largestLpGpPerBdv * rScaled;
      const gpTotal = Math.sum(gaugeLpPointsCopy) + beanGpPerBdv * beanBdv;
      const avgGsPerBdv = totalStalk / totalBdv - 1;
      const gs = (avgGsPerBdv / catchUpRate) * gaugeBdv;
      const beanSeeds = (gs / gpTotal) * beanGpPerBdv; //TODO *seedsprecision

      totalStalk += gs + siloReward;
      gaugeBdv += siloReward;
      totalBdv += siloReward;
      beanBdv += siloReward;

      for (let j = 0; j < tokens.length; ++j) {
        let lpSeeds = 0;
        if (tokens[j] !== -1) {
          if (tokens[j] < 0) {
            lpSeeds = fromBigInt(staticSeeds[j], PRECISION.seeds);
          } else {
            lpSeeds = (gs / gpTotal) * lpGpPerBdv[tokens[j]]; //TODO *seedsprecision
          }
        }

        // Handles germinating deposits not receiving seignorage for 2 seasons.
        // TODO: need to determine based on inputs whether the user deposit is germinating
        // const userBeanShare = i < 2 ? toBigInt(ZERO_BD, PRECISION) : siloReward.times(userStalk[j]).div(totalStalk);
        const userBeanShare = (siloReward * userStalk[j]) / totalStalk;
        userStalk[j] += userBeanShare + userBeans[j] * beanSeeds + userLp[j] * lpSeeds; // TOOD all / seedsprecision
        userBeans[j] += userBeanShare;
      }
    }

    return tokens.map((token, idx) => ({
      token,
      // TOOD: update based on options
      beanYield: userBeans[idx] + userLp[idx],
      stalkYield: userStalk[i],
      ownershipGrowth: 0
    }));
  }

  static #updateR(R, change) {
    const newR = R + change;
    if (newR > 1) {
      return 1;
    } else if (newR < 0) {
      return 0;
    }
    return newR;
  }

  static #scaleR(R) {
    return 0.5 + 0.5 * R;
  }

  // For now we return an increasing R value only when there are no beans minted over the period.
  // In the future this needs to take into account beanstalk state and the frequency of how many seasons have mints
  static #deltaRFromState(earnedBeans) {
    if (earnedBeans == ZERO_BD) {
      return 0.01;
    }
    return -0.01;
  }

  // TODO: implement the various gauge point functions and choose which one to call based on the stored selector
  // see {GaugePointFacet.defaultGaugePointFunction} for implementation.
  // This will become relevant once there are multiple functions implemented in the contract.
  static #updateGaugePoints(gaugePoints, currentPercent, optimalPercent) {
    return gaugePoints;
  }
}

module.exports = GaugeApyUtil;
