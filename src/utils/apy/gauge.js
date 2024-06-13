/**
 * @typedef {import('../../../types/types').DepositYield} DepositYield
 */

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
   * @param {number} catchUpRate - Target number of hours for a deposit's grown stalk to catch up
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
   * Future work includes improvement of the `r` value simulation. This involves using Beanstalk's current state,
   * including L2SR and debt level (temperature cases). Also can be improved by tracking an expected ratio of
   * seasons with mints to seasons without mints. This will allow for a more accurate simulation of its fluctuation.
   *
   * @returns {DepositYield}
   */
  static calcApy(
    // beansPerSeason,
    // tokenNames,
    // tokens,
    // gaugeLpPoints,
    // gaugeLpDepositedBdv,
    // nonGaugeDepositedBdv,
    // gaugeLpOptimalPercentBdv,
    // initialR,
    // siloDepositedBeanBdv,
    // siloStalk,
    // catchUpRate,
    // season,
    // germinatingBeanBdv,
    // gaugeLpGerminatingBdv,
    // nonGaugeGerminatingBdv,
    // staticSeeds
    ...params
  ) {
    console.log('calcApy received params', params);
  }
}

module.exports = GaugeApyUtil;
