const { C } = require('../constants/runtime-constants');
const Contracts = require('../datasources/contracts/contracts');
const { sequelize } = require('../repository/postgres/models');
const TokenRepository = require('../repository/postgres/queries/token-repository');
const BeanstalkSubgraphRepository = require('../repository/subgraph/beanstalk-subgraph');
const BlockUtil = require('../utils/block');
const { createNumberSpread } = require('../utils/number');

class SiloService {
  static async getMigratedGrownStalk(accounts, options = {}) {
    const block = await BlockUtil.blockForSubgraphFromOptions(C().SG.BEANSTALK, options);
    const beanstalk = Contracts.getBeanstalk();

    const siloAssets = (
      await BeanstalkSubgraphRepository.getPreviouslyWhitelistedTokens({
        block: block.number
      })
    ).all;
    const retval = {
      total: 0,
      accounts: []
    };
    for (const account of accounts) {
      const promises = [];
      for (const asset of siloAssets) {
        promises.push(beanstalk.balanceOfGrownStalk(account, asset, { blockTag: block.number }));
      }

      // Parallelize all calls for this account
      const grownStalkResults = (await Promise.all(promises)).map((bi) => createNumberSpread(bi, 10, 2));

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
    const block = await BlockUtil.blockForSubgraphFromOptions(C().SG.BEANSTALK, options);
    const beanstalk = Contracts.getBeanstalk();

    // Assumption is that the user has either migrated everything or migrated nothing.
    // In practice this should always be true because the ui does not allow partial migration.
    const depositedBdvs = await BeanstalkSubgraphRepository.getDepositedBdvs(accounts, block.number);
    const siloAssets = (
      await BeanstalkSubgraphRepository.getPreviouslyWhitelistedTokens({
        block: block.number
      })
    ).all;

    const stemDeltas = [];
    for (const asset of siloAssets) {
      const [migrationStemTip, stemTipNow] = (
        await Promise.all([
          beanstalk.stemTipForToken(asset, { blockTag: C().MILESTONE.siloV3Block }),
          beanstalk.stemTipForToken(asset, { blockTag: block.number })
        ])
      ).map(BigInt);
      stemDeltas.push(Number(stemTipNow - migrationStemTip));
    }

    const retval = {
      total: 0,
      accounts: []
    };
    for (const account in depositedBdvs) {
      const uncategorized = await beanstalk.balanceOfGrownStalkUpToStemsDeployment(account, {
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

  // Updates all whitelisted tokens in the database
  static async updateWhitelistedTokenInfo() {
    const chain = C().CHAIN;
    const beanstalk = Contracts.getBeanstalk();
    const tokenModels = await TokenRepository.findWhitelistedTokens({ where: { chain } });

    const updatedTokens = [];
    await sequelize.transaction(async (transaction) => {
      for (const tokenModel of tokenModels) {
        const token = tokenModel.address;
        const [supply, bdv, stalkEarnedPerSeason, stemTip, totalDeposited, totalDepositedBdv] = await Promise.all([
          Contracts.get(token).totalSupply(),
          beanstalk.bdv(token, BigInt(10 ** tokenModel.decimals)),
          (async () => {
            const tokenSettings = await beanstalk.tokenSettings(token);
            return tokenSettings.stalkEarnedPerSeason;
          })(),
          beanstalk.stemTipForToken(token),
          beanstalk.getTotalDeposited(token),
          beanstalk.getTotalDepositedBdv(token)
        ]);

        updatedTokens.push(
          ...(await TokenRepository.updateToken(
            token,
            chain,
            {
              supply,
              bdv,
              stalkEarnedPerSeason,
              stemTip,
              totalDeposited,
              totalDepositedBdv
            },
            {
              transaction
            }
          ))
        );
      }
    });
    return updatedTokens;
  }
}

module.exports = SiloService;
