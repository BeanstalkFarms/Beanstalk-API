/**
 * @typedef {import('../../types/types').GetApyRequest} GetApyRequest
 * @typedef {import('../../types/types').CalcApysResult} CalcApysResult
 * @typedef {import('../../types/types').WindowEMAResult} WindowEMAResult
 */

const BeanstalkSubgraphRepository = require('../repository/subgraph/beanstalk-subgraph');

const PreGaugeApyUtil = require('../utils/apy/pre-gauge');
const GaugeApyUtil = require('../utils/apy/gauge');
const InputError = require('../error/input-error');
const YieldRepository = require('../repository/postgres/queries/yield-repository');
const { ApyInitType } = require('../repository/postgres/models/types/types');
const YieldModelAssembler = require('../repository/postgres/models/assemblers/yield-assembler');
const RestParsingUtil = require('../utils/rest-parsing');
const { C } = require('../constants/runtime-constants');

const DEFAULT_WINDOWS = [24, 168, 720];

class SiloApyService {
  /**
   * Gets the requested vAPY, calculating if needed
   * @param {GetApyRequest} request
   * @returns {Promise<CalcApysResult>}
   */
  static async getApy(request) {
    // Check whether this request is suitable to be serviced from the database directly
    if (
      (!request.options || RestParsingUtil.onlyHasProperties(request.options, ['initType'])) &&
      (!request.emaWindows || request.emaWindows.every((w) => DEFAULT_WINDOWS.includes(w)))
    ) {
      const season = request.season ?? (await BeanstalkSubgraphRepository.getLatestSeason()).season;
      const yields = await YieldRepository.findSeasonYields(season, {
        emaWindows: request.emaWindows ?? DEFAULT_WINDOWS,
        initType: request.options?.initType ?? ApyInitType.AVERAGE
      });
      if (yields.length > 0) {
        return YieldModelAssembler.fromModels(yields);
      }
    }

    // Prepare to calculate
    if (!request.options?.skipValidation) {
      request = await this.validate(request);
    }
    let { season, emaWindows, tokens, options } = request;
    tokens = tokens.map((t) => t.toLowerCase());
    return await this.calcApy(season, emaWindows, tokens, options);
  }

  /**
   * Validates the get apy request. Validation can be skipped by specifying options.skipValidation.
   * Skipping validation is more performant and is safe due to this involving readonly operations.
   * @param {GetApyRequest}
   * @returns {GetApyRequest}
   */
  static async validate({ season, emaWindows, tokens, options }) {
    emaWindows = emaWindows ?? DEFAULT_WINDOWS;

    // Check whether season/tokens are valid
    const latestSeason = (await BeanstalkSubgraphRepository.getLatestSeason()).season;
    season = season ?? latestSeason;
    if (season > latestSeason) {
      throw new InputError(`Requested season ${season} exceeds the latest available season ${latestSeason}`);
    }

    const availableTokens = await BeanstalkSubgraphRepository.getPreviouslyWhitelistedTokens({ season }, C(season));
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
    return { season, emaWindows, tokens, options };
  }

  /**
   * Calculates vAPYs.
   * @param {number} season
   * @param {number[]} windows
   * @param {string[]} tokens
   * @returns {Promise<CalcApysResult>}
   */
  static async calcApy(season, windows, tokens, options) {
    const apyResults = {
      season,
      yields: {}
    };
    const windowEMAs = await this.calcWindowEMA(season, windows);
    apyResults.emaBeans = windowEMAs.reduce((a, c) => {
      a[c.window] = c.beansPerSeason;
      return a;
    }, {});
    if (!C(season).MILESTONE.isGaugeEnabled({ season })) {
      const sgResult = await BeanstalkSubgraphRepository.getPreGaugeApyInputs(season, C(season));

      // Calculate the apy for each window, i.e. each avg bean reward per season
      for (const ema of windowEMAs) {
        apyResults.yields[ema.window] = PreGaugeApyUtil.calcApy(
          ema.beansPerSeason,
          tokens,
          tokens.map((t) => sgResult.tokens[t].grownStalkPerSeason),
          sgResult.tokens[C().BEAN].grownStalkPerSeason,
          sgResult.silo.depositedBDV,
          sgResult.silo.stalk,
          sgResult.silo.grownStalkPerSeason,
          options
        );
      }
    } else {
      const sgResult = await BeanstalkSubgraphRepository.getGaugeApyInputs(season, C(season));

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

        if (tokenInfo.isGaugeEnabled) {
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
          if (token === C().BEAN) {
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
          sgResult.silo.stalk,
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
   * @param {number} season - the season for which to calculate the EMA
   * @param {number[]} windows - the lookback windows to use
   * @returns {WindowEMAResult[]}
   */
  static async calcWindowEMA(season, windows) {
    // First sunrise after replant. The subgraph has no silo data prior to this.
    const MIN_SEASON = 6075;
    if (season < MIN_SEASON) {
      throw new Error(`Invalid season requested for EMA. Minimum allowed season is ${MIN_SEASON}.`);
    }

    if (Math.min(...windows) <= 0) {
      throw new Error(`Positive lookback window is required.`);
    }

    // Determine effective windows based on how many datapoints are actually available
    const minSeason = Math.max(MIN_SEASON, C().MILESTONE.startSeason) - 1;
    const numDataPoints = [];
    for (const requestedWindow of windows) {
      numDataPoints.push(Math.min(season - minSeason, requestedWindow));
    }

    // Get all results from the subgraph
    const maxWindow = Math.max(...numDataPoints);
    const mints = await BeanstalkSubgraphRepository.getSiloHourlyRewardMints(season - maxWindow + 1, season, C(season));

    // Compute the EMA for each window
    const windowResults = [];
    for (const effectiveWindow of numDataPoints) {
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
