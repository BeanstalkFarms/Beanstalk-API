const SiloApyService = require('../../../service/silo-apy');
const Log = require('../../../utils/logging');
const BeanstalkSubgraphRepository = require('../../subgraph/beanstalk-subgraph');
const YieldRepository = require('../queries/yield-repository');

class ApySeeder {
  static async run() {
    const currentSeason = (await BeanstalkSubgraphRepository.getLatestSeason()).season;

    // Find all missing seasons
    const missingSeasons = await YieldRepository.findMissingSeasons(currentSeason);

    // Calculate and save all vapys for each season (this will take a long time)
    // Currently Pre-exploit seasons are expected to fail
    for (const season of missingSeasons) {
      try {
        await SiloApyService.saveSeasonalApys({ season });
      } catch (e) {
        Log.info(`Could not save apy for season ${season}`, e);
      }
    }
  }
}
module.exports = ApySeeder;
