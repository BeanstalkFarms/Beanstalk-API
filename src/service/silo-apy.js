/**
 * @typedef {import('../../types/types').CalcApysResult} CalcApysResult
 * @typedef {import('../../types/types').WindowEMAResult} WindowEMAResult
 */

const BeanstalkSubgraphRepository = require('../repository/beanstalk-subgraph');

const { BEAN } = require('../constants/addresses');
const PreGaugeApyUtil = require('../utils/apy/pre-gauge');
const GaugeApyUtil = require('../utils/apy/gauge');
const { formatBigintDecimal } = require('../utils/json-formatter');

// First sunrise after replant was for season 6075
const ZERO_SEASON = 6074;
// First sunrise after BIP-45 Seed Gauge was deployed. This is when the APY formula changes
const GAUGE_SEASON = 21798;

class SiloApyService {
  /**
   * Calculates vAPYs.
   * @param {string} beanstalk
   * @param {number} season
   * @param {number[]} windows
   * @param {string[]} tokens
   * @returns {Promise<CalcApysResult[]>}
   */
  static async calcApy(beanstalk, season, windows, tokens) {
    // TODO: refactor this method such that the majority of the logic can be provided by callbacks in the
    // respective apy util. this will avoid redundant loop implementation

    const retval = [];
    const windowEMAs = await SiloApyService.calcWindowEMA(beanstalk, season, windows);
    if (season < GAUGE_SEASON) {
      const sgResult = await BeanstalkSubgraphRepository.getPreGaugeApyInputs(beanstalk, season);

      // Calculate the apy for each window, i.e. each avg bean reward per season
      for (const ema of windowEMAs) {
        const result = PreGaugeApyUtil.calcApy(
          ema.beansPerSeason,
          tokens,
          tokens.map((t) => sgResult.tokens[t].grownStalkPerSeason),
          sgResult.tokens[BEAN].grownStalkPerSeason,
          sgResult.silo.stalk + sgResult.silo.plantableStalk,
          sgResult.silo.seeds
        );
        retval.push({
          beanstalk: beanstalk,
          season: season,
          window: ema.window,
          apys: result
        });
      }
    } else {
      const sgResult = await BeanstalkSubgraphRepository.getGaugeApyInputs(beanstalk, season);
      console.log(JSON.stringify(sgResult, formatBigintDecimal, 2));

      const tokensToCalc = [];
      const gaugeLpPoints = [];
      const gaugeLpDepositedBdv = [];
      const gaugeLpOptimalPercentBdv = [];

      let nonGaugeDepositedBdv = 0n;
      let depositedBeanBdv = 0n;

      let germinatingBeanBdv = [];
      const germinatingGaugeLpBdv = [];
      const germinatingNonGaugeBdv = [0n, 0n];

      const staticSeeds = [];

      // Gather info on all tokens
      for (const token in sgResult.tokens) {
        const tokenInfo = sgResult.tokens[token];
        if (!tokenInfo.isWhitelisted) {
          nonGaugeDepositedBdv += tokenInfo.depositedBDV;
          // We might still want to calculate apy of a dewhitelisted token since users may still hold it in the silo
          if (tokens.includes(token)) {
            tokensToCalc.push(-2);
            staticSeeds.push(1n);
          }
          continue;
        }

        if (tokenInfo.isGauge) {
          // Gauge LP
          gaugeLpPoints.push(tokenInfo.gaugePoints);
          gaugeLpOptimalPercentBdv.push(tokenInfo.optimalPercentDepositedBdv);
          gaugeLpDepositedBdv.push(tokenInfo.depositedBDV);
          germinatingGaugeLpBdv.push(tokenInfo.germinatingBDV);
          if (tokens.includes(token)) {
            tokensToCalc.push(gaugeLpPoints.length - 1);
            staticSeeds.push(null);
          }
        } else {
          if (token === BEAN) {
            depositedBeanBdv = tokenInfo.depositedBDV;
            germinatingBeanBdv = tokenInfo.germinatingBDV;
            if (tokens.includes(token)) {
              tokensToCalc.push(-1);
              staticSeeds.push(null);
            }
          } else {
            // Something other than Bean, but untracked by seed gauge (i.e. unripe)
            nonGaugeDepositedBdv = nonGaugeDepositedBdv + tokenInfo.depositedBDV;
            germinatingNonGaugeBdv[0] += tokenInfo.germinatingBDV[0];
            germinatingNonGaugeBdv[1] += tokenInfo.germinatingBDV[1];
            if (tokens.includes(token)) {
              tokensToCalc.push(-2);
              staticSeeds.push(tokenInfo.stalkEarnedPerSeason);
            }
          }
        }
      }

      for (const ema of windowEMAs) {
        const result = GaugeApyUtil.calcApy(
          ema.beansPerSeason,
          tokens,
          tokensToCalc,
          gaugeLpPoints,
          gaugeLpDepositedBdv,
          nonGaugeDepositedBdv,
          gaugeLpOptimalPercentBdv,
          sgResult.silo.beanToMaxLpGpPerBdvRatio,
          depositedBeanBdv,
          sgResult.silo.stalk + sgResult.silo.plantableStalk,
          4320,
          season,
          germinatingBeanBdv,
          germinatingGaugeLpBdv,
          germinatingNonGaugeBdv,
          staticSeeds
        );
        console.log('gauge apy result', JSON.stringify(result, formatBigintDecimal, 2));
      }
    }
    return retval;
  }

  /**
   * Calculates the beans per season EMA for the requested season and windows
   * @param {number} beanstalk - which Beanstalk to use
   * @param {number} season - the season for which to calculate the EMA
   * @param {number[]} windows - the lookback windows to use
   * @returns {WindowEMAResult[]}
   */
  static async calcWindowEMA(beanstalk, season, windows) {
    if (season <= ZERO_SEASON) {
      throw new Error(`Invalid season requested for EMA. Minimum allowed season is ${ZERO_SEASON}.`);
    }

    if (Math.min(...windows) <= 0) {
      throw new Error(`Positive lookback window is required.`);
    }

    // Determine effective windows based on how many datapoints are actually available
    const effectiveWindows = [];
    for (const requestedWindow of windows) {
      // Currently no datapoints are available for season < ZERO_SEASON,
      // eventually that subtraction will be removed.
      effectiveWindows.push(Math.min(season - ZERO_SEASON, requestedWindow));
    }

    // Get all results from the subgraph
    const maxWindow = Math.max(...effectiveWindows);
    const mints = await BeanstalkSubgraphRepository.getSiloHourlyRewardMints(beanstalk, season - maxWindow, season);

    // Compute the EMA for each window
    const windowResults = [];
    for (const effectiveWindow of effectiveWindows) {
      const beta = 2 / (effectiveWindow + 1);

      let currentEMA = 0;
      let priorEMA = 0;

      for (let i = season - effectiveWindow + 1; i <= season; ++i) {
        currentEMA = (Number(mints[i]) - priorEMA) * beta + priorEMA;
        priorEMA = currentEMA;
      }

      windowResults.push({
        window: effectiveWindow,
        beansPerSeason: BigInt(Math.round(currentEMA))
      });
    }
    return windowResults;
  }
}

module.exports = SiloApyService;
