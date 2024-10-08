const { C } = require('../../../constants/runtime-constants');
const Log = require('../../../utils/logging');
const BeanstalkSubgraphRepository = require('../../subgraph/beanstalk-subgraph');
const DepositRepository = require('../queries/deposit-repository');

// Seeds the deposits table with initial info
class DepositSeeder {
  static async run() {
    const count = await DepositRepository.numRows();
    if (count > 0) {
      Log.info(`Skipping deposit seeder, table has ${count} entries.`);
      return;
    }

    const seedBlock = (await C().RPC.getBlock()).number;

    // Pull list of all deposits from subgraph
    const allDeposits = await BeanstalkSubgraphRepository.getAllDeposits(seedBlock);

    // Organize by account
  }
}

module.exports = DepositSeeder;
