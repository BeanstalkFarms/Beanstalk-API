const { C } = require('../../../constants/runtime-constants');
const BeanstalkSubgraphRepository = require('../../subgraph/beanstalk-subgraph');

// Seeds the deposits table with initial info
class DepositSeeder {
  static async run() {
    // TODO: Execute only when the deposits table is empty

    const seedBlock = (await C().RPC.getBlock()).number;

    // Pull list of all deposits from subgraph
    const allDeposits = BeanstalkSubgraphRepository.getAllDeposits(seedBlock);
  }
}

module.exports = DepositSeeder;
