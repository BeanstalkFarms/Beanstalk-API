/**
 * @typedef {import('../../types/types').GetApyRequest} GetApyRequest
 * @typedef {import('../../types/types').CalcApysResult} CalcApysResult
 * @typedef {import('../../types/types').WindowEMAResult} WindowEMAResult
 *
 * @typedef {import('../../types/types').GetApyHistoryRequest} GetApyHistoryRequest
 * @typedef {import('../../types/types').GetApyHistoryResult} GetApyHistoryResult
 */

const BeanstalkSubgraphRepository = require('../repository/subgraph/beanstalk-subgraph');

const PreGaugeApyUtil = require('./utils/apy/pre-gauge');
const GaugeApyUtil = require('./utils/apy/gauge');
const InputError = require('../error/input-error');
const YieldRepository = require('../repository/postgres/queries/yield-repository');
const { ApyInitType } = require('../repository/postgres/models/types/types');
const YieldModelAssembler = require('../repository/postgres/models/assemblers/yield-assembler');
const RestParsingUtil = require('../utils/rest-parsing');
const { C } = require('../constants/runtime-constants');
const TokenRepository = require('../repository/postgres/queries/token-repository');
const AsyncContext = require('../utils/async/context');

class SiloApyService {
  static DEFAULT_WINDOWS = [24, 168, 720];

  /**
   * Gets the requested vAPY, calculating if needed
   * @param {GetApyRequest} request
   * @returns {Promise<CalcApysResult>}
   */
  static async getApy(request) {
    // Check whether this request is suitable to be serviced from the database directly
    if (
      (!request.options || RestParsingUtil.onlyHasProperties(request.options, ['initType'])) &&
      (!request.emaWindows || request.emaWindows.every((w) => this.DEFAULT_WINDOWS.includes(w)))
    ) {
      const season = request.season ?? (await BeanstalkSubgraphRepository.getLatestSeason()).season;
      const yields = await YieldRepository.findSeasonYields(season, {
        where: {
          emaWindows: request.emaWindows ?? this.DEFAULT_WINDOWS,
          initType: request.options?.initType ?? ApyInitType.AVERAGE
        }
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
   * Gets the requested historical vAPYs from the database, if they have been calculated already
   * @param {GetApyHistoryRequest} request
   * @returns {Promise<GetApyHistoryResult>}
   */
  static async getHistoricalApy(request) {
    const yieldModels = await YieldRepository.findHistoricalYields(request);
    return yieldModels.reduce((acc, next) => {
      acc[next.season] = {
        bean: next.beanYield,
        stalk: next.stalkYield,
        ownership: next.ownershipYield
      };
      return acc;
    }, {});
  }

  /**
   * Validates the get apy request, and sets default values.
   * Validation can be skipped by specifying options.skipValidation.
   * Skipping validation is more performant and is safe when doing readonly operations.
   * @param {GetApyRequest}
   * @returns {GetApyRequest}
   */
  static async validate({ season, emaWindows, tokens, options }) {
    emaWindows ??= this.DEFAULT_WINDOWS;
    options ??= {};
    options.initType ??= ApyInitType.AVERAGE;

    // Check whether season/tokens are valid
    const latestSeason = (await BeanstalkSubgraphRepository.getLatestSeason()).season;
    season ??= latestSeason;
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
    const c = C(season);
    const apyResults = {
      season,
      yields: {},
      initType: options.initType
    };
    const windowEMAs = await this.calcWindowEMA(season, windows);
    apyResults.ema = windowEMAs.reduce((acc, next, idx) => {
      acc[windows[idx]] = {
        effectiveWindow: next.window,
        rewardBeans: next.beansPerSeason
      };
      return acc;
    }, {});
    if (!c.MILESTONE.isGaugeEnabled({ season })) {
      const sgResult = await BeanstalkSubgraphRepository.getPreGaugeApyInputs(season, c);

      // Calculate the apy for each window, i.e. each avg bean reward per season
      for (const ema of windowEMAs) {
        apyResults.yields[ema.window] = PreGaugeApyUtil.calcApy(
          ema.beansPerSeason,
          tokens,
          tokens.map((t) => sgResult.tokens[t].grownStalkPerSeason),
          sgResult.tokens[c.BEAN].grownStalkPerSeason,
          sgResult.silo.depositedBDV,
          sgResult.silo.stalk,
          sgResult.silo.grownStalkPerSeason,
          options
        );
      }
    } else {
      const sgResult = await BeanstalkSubgraphRepository.getGaugeApyInputs(season, c);

      const tokenLabels = [];
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

        if (tokenInfo.depositedBDV === 0n) {
          // Do not calculate yields on tokens with no deposits
          continue;
        } else if (tokens.includes(token)) {
          tokenLabels.push(token);
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
          if (token === c.BEAN) {
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
          tokenLabels,
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
    const c = C(season);
    // The beanstalk subgraph has no silo data prior to replant.
    if (season < c.MIN_EMA_SEASON) {
      throw new Error(`Invalid season requested for EMA. Minimum allowed season is ${c.MIN_EMA_SEASON}.`);
    }

    if (Math.min(...windows) <= 0) {
      throw new Error(`Positive lookback window is required.`);
    }

    // Determine effective windows based on how many datapoints are actually available
    const minSeason = Math.max(c.MIN_EMA_SEASON, c.MILESTONE.startSeason) - 1;
    const numDataPoints = [];
    for (const requestedWindow of windows) {
      numDataPoints.push(Math.min(season - minSeason, requestedWindow));
    }

    // Get all results from the subgraph
    const maxWindow = Math.max(...numDataPoints);
    const mints = await BeanstalkSubgraphRepository.getSiloHourlyRewardMints(season - maxWindow + 1, season, c);

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

  // Computes and saves the deafult seasonal apy entries.
  // Defaults to the latest season if none is provided
  static async saveSeasonalApys({ season, tokenModels } = {}) {
    if (!season) {
      season = (await BeanstalkSubgraphRepository.getLatestSeason()).season;
    }

    if (!tokenModels) {
      // Determine list of tokens active at this point from subgraph
      const availableTokens = await BeanstalkSubgraphRepository.getPreviouslyWhitelistedTokens({ season }, C(season));
      tokenModels = await TokenRepository.findByAddresses(availableTokens.all);
    }
    const tokenAddrs = tokenModels.map((t) => t.address.toLowerCase());

    // Compute with both init types. Skips `getApy` method - avoids db check and rest validations
    const [latestAvgApy, latestNewApy] = await Promise.all([
      SiloApyService.calcApy(season, SiloApyService.DEFAULT_WINDOWS, tokenAddrs, {
        initType: ApyInitType.AVERAGE
      }),
      SiloApyService.calcApy(season, SiloApyService.DEFAULT_WINDOWS, tokenAddrs, {
        initType: ApyInitType.NEW
      })
    ]);

    // Prepare rows
    const yieldRows = [
      ...YieldModelAssembler.toModels(latestAvgApy, ApyInitType.AVERAGE, tokenModels),
      ...YieldModelAssembler.toModels(latestNewApy, ApyInitType.NEW, tokenModels)
    ];

    // Save new yields
    await AsyncContext.sequelizeTransaction(async () => {
      return await YieldRepository.addYields(yieldRows);
    });
  }
}

module.exports = SiloApyService;
