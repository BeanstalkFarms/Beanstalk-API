const { C } = require('../../../constants/runtime-constants');
const Log = require('../../../utils/logging');
const MetaRepository = require('../queries/meta-repository');
const DepositSeeder = require('./deposit-seeder');

const SEEDERS = [DepositSeeder];
let progress = 0;

// For seeding the database during api uptime, ideal for longer running seeds.
class StartupSeeder {
  static async seedDatabase() {
    // Initialize db meta
    const meta = await MetaRepository.get(C().CHAIN);
    if (!meta) {
      await MetaRepository.insert({ chain: C().CHAIN });
    }

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
