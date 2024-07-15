const { BEAN, BEAN3CRV, BEANWETH, UNRIPE_BEAN, UNRIPE_LP } = require('../constants/addresses');
const { MILESTONE } = require('../constants/constants');
const Contracts = require('../datasources/contracts/contracts');
const subgraphClient = require('../datasources/subgraph-client');
const BeanstalkSubgraphRepository = require('../repository/beanstalk-subgraph');
const BlockUtil = require('../utils/block');
const { createNumberSpread } = require('../utils/number');

class SiloService {
  static async getMigratedGrownStalk(accounts, options = {}) {
    const block = await BlockUtil.blockForSubgraphFromOptions(subgraphClient.beanstalkSG, options);
    const beanstalk = await Contracts.asyncBeanstalkContractGetter(block.number);

    // TODO: when subgraph-beanstalk2.2.0 is deployed, get whitelisted + dewhitelisted from there instead
    const siloAssets = [BEAN, BEAN3CRV, BEANWETH, UNRIPE_BEAN, UNRIPE_LP];
    const retval = {
      total: 0,
      accounts: []
    };
    for (const account of accounts) {
      const promises = [];
      for (const asset of siloAssets) {
        promises.push(beanstalk.callStatic.balanceOfGrownStalk(account, asset, { blockTag: block.number }));
      }

      // Parallelize all calls for this account
      const grownStalkResults = (await Promise.all(promises)).map((bn) => createNumberSpread(bn, 10, 2));

      // Compute total and by asset breakdown
      let total = 0;
      const breakdown = {};
      for (let i = 0; i < grownStalkResults.length; ++i) {
        total += grownStalkResults[i].float;
        breakdown[siloAssets[i]] = grownStalkResults[i].float;
      }

      retval.total += total;
      retval.accounts.push({
        account,
        siloV3: true,
        total,
        breakdown
      });
    }
    // Sort the largest grown stalk amounts first
    retval.accounts.sort((a, b) => b.total - a.total);
    return retval;
  }

  static async getUnmigratedGrownStalk(accounts, options = {}) {
    const block = await BlockUtil.blockForSubgraphFromOptions(subgraphClient.beanstalkSG, options);
    const beanstalk = await Contracts.asyncBeanstalkContractGetter(block.number);

    // Assumption is that the user has either migrated everything or migrated nothing.
    // In practice this should always be true because the ui does not allow partial migration.
    const depositedBdvs = await BeanstalkSubgraphRepository.getDepositedBdvs(accounts, block.number);
    const siloAssets = [BEAN, BEAN3CRV, UNRIPE_BEAN, UNRIPE_LP].map((s) => s.toLowerCase());

    const stemDeltas = [];
    for (const asset of siloAssets) {
      const [migrationStemTip, stemTipNow] = await Promise.all([
        beanstalk.callStatic.stemTipForToken(asset, { blockTag: MILESTONE.siloV3 }),
        beanstalk.callStatic.stemTipForToken(asset, { blockTag: block.number })
      ]);
      stemDeltas.push(stemTipNow.sub(migrationStemTip).toNumber());
    }

    const retval = {
      total: 0,
      accounts: []
    };
    for (const account in depositedBdvs) {
      const uncategorized = await beanstalk.callStatic.balanceOfGrownStalkUpToStemsDeployment(account, {
        blockTag: block.number
      });
      const uncategorizedFloat = createNumberSpread(uncategorized, 10, 2).float;

      // Compute total and by asset breakdown
      const depositedBdv = depositedBdvs[account];
      let total = uncategorizedFloat;
      const breakdown = {};
      for (let i = 0; i < stemDeltas.length; ++i) {
        let grownStalk = (stemDeltas[i] * parseInt(depositedBdv[siloAssets[i]] ?? 0)) / Math.pow(10, 10);
        grownStalk = parseFloat(grownStalk.toFixed(2));
        total += grownStalk;
        breakdown[siloAssets[i]] = grownStalk;
      }

      retval.total += total;
      retval.accounts.push({
        account,
        siloV3: false,
        total,
        upToStemsDeployment: uncategorizedFloat,
        afterStemsDeployment: breakdown
      });
    }
    // Sort the largest grown stalk amounts first
    retval.accounts.sort((a, b) => b.total - a.total);
    return retval;
  }
}

module.exports = SiloService;
