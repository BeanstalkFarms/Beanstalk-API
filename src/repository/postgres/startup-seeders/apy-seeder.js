const { C } = require('../../../constants/runtime-constants');
const SiloApyService = require('../../../service/silo-apy');
const Log = require('../../../utils/logging');
const BeanstalkSubgraphRepository = require('../../subgraph/beanstalk-subgraph');
const YieldRepository = require('../queries/yield-repository');

class ApySeeder {
  static async run() {
    const currentSeason = (await BeanstalkSubgraphRepository.getLatestSeason()).season;

    // Find all missing seasons
    let missingSeasons = await YieldRepository.findMissingSeasons(currentSeason);
    missingSeasons = missingSeasons.filter((s) => s >= C().MIN_EMA_SEASON);

    // Calculate and save all vapys for each season (this will take a long time)
    // Currently Pre-exploit seasons are expected to fail
    for (const season of missingSeasons) {
      try {
        await SiloApyService.saveSeasonalApys({ season });
        Log.info(`Saved apy for season ${season}`);
      } catch (e) {
        Log.info(`Could not save apy for season ${season}`, e);
      }
    }
  }
}
module.exports = ApySeeder;
