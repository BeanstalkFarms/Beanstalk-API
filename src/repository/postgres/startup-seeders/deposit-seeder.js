const { C } = require('../../../constants/runtime-constants');
const Contracts = require('../../../datasources/contracts/contracts');
const DepositService = require('../../../service/deposit-service');
const SiloService = require('../../../service/silo-service');
const Concurrent = require('../../../utils/async/concurrent');
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

    //// TODO: this part should be accessible elsewhere to also use during regular updates
    // Get current bdvs for all deposits
    const bdvsCalldata = {
      tokens: [],
      amounts: []
    };
    for (const deposit of allDeposits) {
      bdvsCalldata.tokens.push(deposit.token);
      bdvsCalldata.amounts.push(deposit.depositedAmount);
    }
    const depositLambdaBdvs = await SiloService.batchBdvs(bdvsCalldata, seedBlock);

    // Updates lambda stats
    for (let i = 0; i < allDeposits.length; ++i) {
      allDeposits[i].updateLambdaStats(depositLambdaBdvs[i], tokenInfos[allDeposits[i].token]);
    }
    ////

    await DepositService.updateDeposits(allDeposits, seedBlock);
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
