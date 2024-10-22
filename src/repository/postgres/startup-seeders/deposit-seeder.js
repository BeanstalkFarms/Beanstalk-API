const { C } = require('../../../constants/runtime-constants');
const DepositService = require('../../../service/deposit-service');
const AppMetaService = require('../../../service/meta-service');
const SiloService = require('../../../service/silo-service');
const AsyncContext = require('../../../utils/async/context');
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

    // const seedBlock = (await C().RPC.getBlock()).number;
    const seedBlock = 266437145; //REVERT

    // Initial deposits list comes directly from subgraph
    const allDeposits = await BeanstalkSubgraphRepository.getAllDeposits(seedBlock);
    Log.info(`Seeding with ${allDeposits.length} deposits as of block ${seedBlock}`);

    const accounts = this.getDepositsByAccount(allDeposits);
    const tokenInfos = await SiloService.getWhitelistedTokenInfo({ block: seedBlock, chain: C().CHAIN });

    // Get mow stems for each account/token pair
    const accountTokenPairs = [];
    for (const account in accounts) {
      for (const token in accounts[account]) {
        accountTokenPairs.push({ account, token });
      }
    }
    const mowStems = await SiloService.getMowStems(accountTokenPairs);

    // Update each deposit with its current info
    for (const account in accounts) {
      for (const token in accounts[account]) {
        for (const deposit of accounts[account][token]) {
          deposit.mowStem = mowStems[`${account}|${token}`];
          deposit.setStalkAndSeeds(tokenInfos[token]);
        }
      }
    }

    await DepositService.batchUpdateLambdaBdvs(allDeposits, tokenInfos, seedBlock);
    const bdvsAtUpdate = Object.keys(tokenInfos).reduce((acc, next) => {
      acc[next] = tokenInfos[next].bdv;
      return acc;
    }, {});

    // Write initial deposits to db
    await AsyncContext.sequelizeTransaction(async () => {
      await DepositService.updateDeposits(allDeposits);
      await AppMetaService.setLastDepositUpdate(seedBlock);
      await AppMetaService.setLastLambdaBdvs(bdvsAtUpdate);
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
