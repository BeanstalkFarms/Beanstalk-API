const { BEAN, BEAN3CRV, BEANWETH, UNRIPE_BEAN, UNRIPE_LP } = require("../constants/addresses");
const { asyncBeanstalkContractGetter } = require("../datasources/contracts");
const BlockUtil = require("../utils/block");
const { createNumberSpread } = require("../utils/number");

class SiloService {

  static async getGrownStalk(accounts, options = {}) {
    const block = await BlockUtil.blockFromOptions(options);
    const beanstalk = await asyncBeanstalkContractGetter(block.number);
    
    const retval = {
      total: 0,
      accounts: []
    };
    for (const account of accounts) {
      // TODO: when subgraph-beanstalk2.2.0 is deployed, get whitelisted + dewhitelisted from there instead
      const siloAssets = [BEAN, BEAN3CRV, BEANWETH, UNRIPE_BEAN, UNRIPE_LP];
      const promises = [];
      for (const asset of siloAssets) {
        promises.push(beanstalk.callStatic.balanceOfGrownStalk(account, asset, { blockTag: block.number }));
      }

      // Unmigrated stalk
      promises.push(beanstalk.callStatic.balanceOfGrownStalkUpToStemsDeployment(account, { blockTag: block.number }));

      // Parallelize all calls for this account
      const grownStalkResults = (await Promise.all(promises)).map(bn => createNumberSpread(bn, 10, 2));
      
      // Compute total and by asset breakdown
      let total = 0;
      const breakdown = {};
      for (let i = 0; i < grownStalkResults.length; ++i) {
        total += grownStalkResults[i].float;
        const label = siloAssets[i] ?? 'unmigrated';
        breakdown[label] = grownStalkResults[i].float;
      }

      retval.total += total;
      retval.accounts.push({
        account,
        total,
        breakdown
      });
    }
    // Sort the largest grown stalk amounts first
    retval.accounts.sort((a, b) => b.total - a.total);
    return retval;
  }
}

module.exports = SiloService;
