const AppMetaService = require('../../../service/meta-service');
const Log = require('../../../utils/logging');
const ApySeeder = require('./apy-seeder');
const DepositSeeder = require('./deposit-seeder');

const SEEDERS = [DepositSeeder, ApySeeder];
let progress = 0;

// For seeding the database during api uptime, ideal for longer running seeds.
class StartupSeeder {
  static async seedDatabase() {
    // Initialize db meta
    await AppMetaService.init();

    for (let i = 0; i < SEEDERS.length; ++i) {
      Log.info(`Running seeder [${progress}]...`);
      await SEEDERS[i].run();
      ++progress;
    }
    Log.info(`Completed all seeders`);
  }

  static isSeeded(seeder) {
    const index = SEEDERS.indexOf(seeder);
    if (index === -1) {
      throw new Error('The provided object was not a Seeder.');
    }
    return progress > index;
  }
}
module.exports = StartupSeeder;
