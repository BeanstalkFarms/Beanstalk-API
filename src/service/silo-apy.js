/**
 * @typedef {import('../../types/types').GetApyRequest} GetApyRequest
 * @typedef {import('../../types/types').CalcApysResult} CalcApysResult
 * @typedef {import('../../types/types').WindowEMAResult} WindowEMAResult
 */

const BeanstalkSubgraphRepository = require('../repository/beanstalk-subgraph');

const { BEAN, BEANSTALK } = require('../constants/addresses');
const PreGaugeApyUtil = require('../utils/apy/pre-gauge');
const GaugeApyUtil = require('../utils/apy/gauge');
const InputError = require('../error/input-error');

// First sunrise after replant was for season 6075
const ZERO_SEASON = 6074;
// First sunrise after BIP-45 Seed Gauge was deployed. This is when the APY formula changes
const GAUGE_SEASON = 21798;

const DEFAULT_WINDOWS = [24, 168, 720];

class SiloApyService {
  /**
   * Gets the requested vAPY, calculating if needed
   * @param {GetApyRequest}
   * @returns {Promise<CalcApysResult>}
   */
  static async getApy(request) {
    // Check whether this request is suitable to be serviced from the database directly
    if (!request.options && (!request.emaWindows || request.emaWindows.every((w) => DEFAULT_WINDOWS.includes(w)))) {
      console.log('--------');
      console.log('This info would be in the database!');
      // Note that some of the requested tokens (i.e. dewhitelisted) might not be stored in the db, not sure yet
    }

    // Prepare to calculate
    if (!request.options?.skipValidation) {
      request = await this.validate(request);
    }
    let { beanstalk, season, emaWindows, tokens, options } = request;
    tokens = tokens.map((t) => t.toLowerCase());
    return await this.calcApy(beanstalk, season, emaWindows, tokens, options);
  }

  /**
   * Validates the get apy request. Validation can be skipped by specifying options.skipValidation.
   * Skipping validation is more performant and is safe due to this involving readonly operations.
   * @param {GetApyRequest}
   * @returns {GetApyRequest}
   */
  static async validate({ beanstalk, season, emaWindows, tokens, options }) {
    beanstalk = (beanstalk ?? BEANSTALK).toLowerCase();
    emaWindows = emaWindows ?? DEFAULT_WINDOWS;

    // Check whether season/tokens are valid
    const latestSeason = await BeanstalkSubgraphRepository.getLatestSeason(beanstalk);
    season = season ?? latestSeason;
    if (season > latestSeason) {
      throw new InputError(`Requested season ${season} exceeds the latest on-chain season ${latestSeason}`);
    }

    const availableTokens = await BeanstalkSubgraphRepository.getPreviouslyWhitelistedTokens(beanstalk, season);
    if (!tokens) {
      tokens = availableTokens.whitelisted;
    } else {
      tokens = tokens.map((t) => t.toLowerCase());
      for (const token of tokens) {
        if (!availableTokens.all.includes(token)) {
          throw new InputError(`Token ${token} is not available for season ${season}`);
        }
      }
    }
    return { beanstalk, season, emaWindows, tokens, options };
  }

  /**
   * Calculates vAPYs.
   * @param {string} beanstalk
   * @param {number} season
   * @param {number[]} windows
   * @param {string[]} tokens
   * @returns {Promise<CalcApysResult>}
   */
  static async calcApy(beanstalk, season, windows, tokens, options) {
    const apyResults = {
      beanstalk,
      season,
      yields: {}
    };
    const windowEMAs = await this.calcWindowEMA(beanstalk, season, windows);
    if (season < GAUGE_SEASON) {
      const sgResult = await BeanstalkSubgraphRepository.getPreGaugeApyInputs(beanstalk, season);

      // Calculate the apy for each window, i.e. each avg bean reward per season
      for (const ema of windowEMAs) {
        apyResults.yields[ema.window] = PreGaugeApyUtil.calcApy(
          ema.beansPerSeason,
          tokens,
          tokens.map((t) => sgResult.tokens[t].grownStalkPerSeason),
          sgResult.tokens[BEAN].grownStalkPerSeason,
          sgResult.silo.depositedBDV,
          sgResult.silo.stalk + sgResult.silo.plantableStalk,
          sgResult.silo.seeds,
          options
        );
      }
    } else {
      const sgResult = await BeanstalkSubgraphRepository.getGaugeApyInputs(beanstalk, season);

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

      // Gather info on all tokens. Process requested tokens in the order received.
      const allTokens = [...new Set([...tokens, ...Object.keys(sgResult.tokens)])];
      for (const token of allTokens) {
        const tokenInfo = sgResult.tokens[token];
        if (!tokenInfo) {
          throw new InputError(`Unrecognized token ${token}`);
        }

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
        apyResults.yields[ema.window] = GaugeApyUtil.calcApy(
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
          season,
          germinatingBeanBdv,
          germinatingGaugeLpBdv,
          germinatingNonGaugeBdv,
          staticSeeds,
          options
        );
      }
    }
    return apyResults;
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
