const { C } = require('../../../constants/runtime-constants');
const Contracts = require('../../../datasources/contracts/contracts');
const SiloService = require('../../../service/silo-service');
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
    const beanstalk = Contracts.getBeanstalk();

    // Initial deposits list comes directly from subgraph
    const allDeposits = await BeanstalkSubgraphRepository.getAllDeposits(seedBlock);
    const accounts = this.getDepositsByAccount(allDeposits);

    const tokenInfos = await SiloService.getWhitelistedTokenInfo({ block: seedBlock, chain: C().CHAIN });
    console.log(tokenInfos);

    // Get mow stems for each account/token pair, and update the deposit
    for (const account in accounts) {
      for (const token in accounts[account]) {
        const tokenInfo = tokenInfos[token];
        const lastStem = await beanstalk.getLastMowedStem(account, token, { blockTag: seedBlock });
        for (const deposit of accounts[account][token]) {
          deposit.mowStem = lastStem;
          // Set inherent deposit info
          deposit.setStalkAndSeeds(tokenInfo);
          // Updates lambda stats according to current token bdv
          // deposit.updateLambdaStats(tokenInfo);
        }
        console.log(accounts[account][token]);
      }
    }

    // save

    // save meta with block number used
  }

  static getDepositsByAccount(allDeposits) {
    const accounts = {};
    for (const deposit of allDeposits) {
      accounts[deposit.account] ||= {};
      accounts[deposit.account][deposit.token] ||= [];
      accounts[deposit.account][deposit.token].push(deposit);
    }
    return accounts;
  }
}

module.exports = DepositSeeder;
