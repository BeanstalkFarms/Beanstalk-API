const YieldService = require('../../../service/yield-service');
const Concurrent = require('../../../utils/async/concurrent');
const Log = require('../../../utils/logging');

class ApySeeder {
  static async run() {
    // Find all missing seasons
    let missingSeasons = await YieldService.findMissingSeasons();

    // Calculate and save all vapys for each season (this will take a long time)
    const TAG = Concurrent.tag('apySeeder');
    for (const season of missingSeasons) {
      await Concurrent.run(TAG, 2, async () => {
        try {
          await YieldService.saveSeasonalApys({ season });
          Log.info(`Saved apy for season ${season}`);
        } catch (e) {
          Log.info(`Could not save apy for season ${season}`, e);
          throw e;
        }
      });
    }
    await Concurrent.allSettled(TAG);
  }
}
module.exports = ApySeeder;
