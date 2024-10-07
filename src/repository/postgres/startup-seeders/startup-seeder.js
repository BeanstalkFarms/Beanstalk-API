const DepositSeeder = require('./deposit-seeder');

const SEEDERS = [DepositSeeder];
let progress = 0;

// For seeding the database during api uptime, ideal for longer running seeds.
class StartupSeeder {
  static async seedDatabase() {
    for (let i = 0; i < SEEDERS.length; ++i) {
      await SEEDERS[i].run();
      ++progress;
    }
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
