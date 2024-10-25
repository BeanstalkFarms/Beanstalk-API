const YieldService = require('../../../service/yield-service');
const Concurrent = require('../../../utils/async/concurrent');
const Log = require('../../../utils/logging');

class ApySeeder {
  static async run() {
    // Find all missing seasons
    let missingSeasons = await YieldService.findMissingSeasons();

    // Calculate and save all vapys for each season (this will take a long time)
    // Currently Pre-exploit seasons are expected to fail
    const TAG = Concurrent.tag('apySeeder');
    for (const season of missingSeasons) {
      try {
        // TODO: This can be increased once the decentralized subgraphs are deployed + the rate limit is increased
        await Concurrent.run(TAG, 2, async () => {
          await YieldService.saveSeasonalApys({ season });
        });
        Log.info(`Saved apy for season ${season}`);
      } catch (e) {
        Log.info(`Could not save apy for season ${season}`, e);
      }
    }
    await Concurrent.allSettled(TAG);
  }
}
module.exports = ApySeeder;
