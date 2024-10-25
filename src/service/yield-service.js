/**
 * @typedef {import('../../types/types').GetApyHistoryRequest} GetApyHistoryRequest
 * @typedef {import('../../types/types').GetApyHistoryResult} GetApyHistoryResult
 */

const { C } = require('../constants/runtime-constants');
const YieldModelAssembler = require('../repository/postgres/models/assemblers/yield-assembler');
const { ApyInitType } = require('../repository/postgres/models/types/types');
const TokenRepository = require('../repository/postgres/queries/token-repository');
const YieldRepository = require('../repository/postgres/queries/yield-repository');
const BeanstalkSubgraphRepository = require('../repository/subgraph/beanstalk-subgraph');
const AsyncContext = require('../utils/async/context');
const SiloApyService = require('./silo-apy');

class YieldService {
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

  // Returns a list of seasons that are missing a yield entry
  static async findMissingSeasons() {
    const currentSeason = (await BeanstalkSubgraphRepository.getLatestSeason()).season;
    let missingSeasons = await YieldRepository.findMissingSeasons(currentSeason);
    return missingSeasons.filter((s) => s >= C().MIN_EMA_SEASON);
  }
}
module.exports = YieldService;
