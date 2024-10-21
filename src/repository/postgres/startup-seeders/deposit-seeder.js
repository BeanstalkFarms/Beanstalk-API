const { C } = require('../../../constants/runtime-constants');
const Contracts = require('../../../datasources/contracts/contracts');
const DepositService = require('../../../service/deposit-service');
const SiloService = require('../../../service/silo-service');
const Concurrent = require('../../../utils/async/concurrent');
const AsyncContext = require('../../../utils/async/context');
const Log = require('../../../utils/logging');
const BeanstalkSubgraphRepository = require('../../subgraph/beanstalk-subgraph');
const DepositRepository = require('../queries/deposit-repository');
const MetaRepository = require('../queries/meta-repository');

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
    Log.info(`Seeding with ${allDeposits.length} deposits as of block ${seedBlock}`);

    const accounts = this.getDepositsByAccount(allDeposits);
    const tokenInfos = await SiloService.getWhitelistedTokenInfo({ block: seedBlock, chain: C().CHAIN });

    // Get mow stems for each account/token pair, and update the deposit
    for (const account in accounts) {
      for (const token in accounts[account]) {
        await Concurrent.run('DepositSeeder', async () => {
          const tokenInfo = tokenInfos[token];
          const lastStem = await beanstalk.getLastMowedStem(account, token, { blockTag: seedBlock });
          for (const deposit of accounts[account][token]) {
            deposit.mowStem = lastStem;
            // Set inherent deposit info
            deposit.setStalkAndSeeds(tokenInfo);
          }
        });
      }
    }
    await Concurrent.allResolved('DepositSeeder');

    await DepositService.batchUpdateLambdaBdvs(allDeposits, tokenInfos, seedBlock);

    // Write initial deposits to db
    await AsyncContext.sequelizeTransaction(async () => {
      await DepositService.updateDeposits(allDeposits);
      await MetaRepository.update(C().CHAIN, {
        lastDepositUpdate: seedBlock
      });
    });
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
