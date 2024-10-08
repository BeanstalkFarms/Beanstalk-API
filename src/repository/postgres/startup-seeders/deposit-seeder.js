const { C } = require('../../../constants/runtime-constants');
const Contracts = require('../../../datasources/contracts/contracts');
const Log = require('../../../utils/logging');
const BeanstalkSubgraphRepository = require('../../subgraph/beanstalk-subgraph');
const DepositRepository = require('../queries/deposit-repository');
const TokenRepository = require('../queries/token-repository');

// Seeds the deposits table with initial info
class DepositSeeder {
  static async run() {
    const count = await DepositRepository.numRows();
    if (count > 0) {
      Log.info(`Skipping deposit seeder, table has ${count} entries.`);
      return;
    }

    const seedBlock = (await C().RPC.getBlock()).number;

    // Initial deposits list comes directly from subgraph
    const allDeposits = await BeanstalkSubgraphRepository.getAllDeposits(seedBlock);
    console.log('num deposits', allDeposits.length);

    // Organize by account/token so its clear which mow stems are needed.
    const accounts = {};
    for (const deposit of allDeposits) {
      deposit.chain = C().CHAIN;
      accounts[deposit.account] ||= {};
      accounts[deposit.account][deposit.token] ||= [];
      accounts[deposit.account][deposit.token].push(deposit);
    }
    ////
    const beanstalk = Contracts.getBeanstalk();
    const tokenModels = await TokenRepository.findWhitelistedTokens({ where: { chain: C().CHAIN } });
    const tokenSettings = {};
    for (const token of tokenModels) {
      tokenSettings[token.address] = await beanstalk.tokenSettings(token.address, { blockTag: seedBlock });
    }
    ////
    console.log(tokenSettings);

    for (const account in accounts) {
      for (const token in accounts[account]) {
        const lastStem = await beanstalk.getLastMowedStem(account, token, { blockTag: seedBlock });
        console.log(account, token, lastStem);
        // currentStalk
        // baseStalk
        // grownStalk
        // mowStem
        // mowableStalk
        // currentSeeds
      }
    }

    // Bdv on lambda etc should go through some lambda specific logic external to this seeder
    // bdvOnLambda
    // stalkOnLambda
    // seedsOnLambda

    // save

    // save meta with block number used
  }
}

module.exports = DepositSeeder;
