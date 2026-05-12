const { C } = require('../constants/runtime-constants');
const Contracts = require('../datasources/contracts/contracts');
const Multicall = require('../datasources/contracts/multicall');
const TokenRepository = require('../repository/postgres/queries/token-repository');
const BeanstalkSubgraphRepository = require('../repository/subgraph/beanstalk-subgraph');
const ArraysUtil = require('../utils/arrays');
const BlockUtil = require('../utils/block');
const Concurrent = require('../utils/async/concurrent');
const { createNumberSpread } = require('../utils/number');
const AsyncContext = require('../utils/async/context');

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

  // Combines results from tokenSettings + stemTipForToken
  static async getWhitelistedTokenInfo({ block, chain }) {
    const beanstalk = Contracts.getBeanstalk();
    const tokenModels = await TokenRepository.findWhitelistedTokens(chain);
    const addresses = tokenModels.map((t) => t.address);

    const multicallResults = await Multicall.aggregate(
      addresses.flatMap((t) => [
        { contract: beanstalk, method: 'tokenSettings', args: [t], blockTag: block },
        { contract: beanstalk, method: 'stemTipForToken', args: [t], blockTag: block },
        {
          contract: beanstalk,
          method: 'bdv',
          args: [t, BigInt(10 ** C().DECIMALS[t])],
          blockTag: block,
          allowFailure: true
        }
      ])
    );

    return addresses.reduce((acc, next, idx) => {
      const resultIndex = idx * 3;
      acc[next] = {
        ...multicallResults[resultIndex],
        stemTip: multicallResults[resultIndex + 1],
        bdv: multicallResults[resultIndex + 2] ?? 1n
      };
      return acc;
    }, {});
  }

  // Retrieves all mow stems for the requested account/token pairs
  static async getMowStems(accountTokenPairs, blockNumber) {
    const results = {};
    const beanstalk = Contracts.getBeanstalk();
    const pairChunks = ArraysUtil.toChunks(accountTokenPairs, 500);

    for (const pairChunk of pairChunks) {
      const chunkResults = await Multicall.aggregate(
        pairChunk.map(({ account, token }) => ({
          contract: beanstalk,
          method: 'getLastMowedStem',
          args: [account, token],
          blockTag: blockNumber
        }))
      );

      for (let i = 0; i < pairChunk.length; ++i) {
        const { account, token } = pairChunk[i];
        results[`${account}|${token}`] = chunkResults[i];
      }
    }

    return results;
  }

  static async batchBdvs(calldata, block, batchSize = 100) {
    const beanstalk = Contracts.getBeanstalk();
    const tokenBatches = ArraysUtil.toChunks(calldata.tokens, batchSize);
    const amountBatches = ArraysUtil.toChunks(calldata.amounts, batchSize);

    const results = [];
    results.length = calldata.tokens.length;

    const TAG = Concurrent.tag('batchBdvs');
    for (let i = 0; i < tokenBatches.length; i++) {
      const batchTokens = tokenBatches[i];
      const batchAmounts = amountBatches[i];

      // Call the bdvs function
      await Concurrent.run(TAG, 50, async () => {
        const bdvsResult = await beanstalk.bdvs(batchTokens, batchAmounts, { blockTag: block });
        // Preserve result order
        results.splice(i * batchSize, batchSize, ...bdvsResult);
      });
    }
    await Concurrent.allResolved(TAG);
    return results;
  }

  // Updates all whitelisted tokens in the database
  static async updateWhitelistedTokenInfo() {
    const chain = C().CHAIN;
    const beanstalk = Contracts.getBeanstalk();
    const tokenModels = await TokenRepository.findWhitelistedTokens(chain);

    const updatedTokens = [];
    await AsyncContext.sequelizeTransaction(async () => {
      const multicallResults = await Multicall.aggregate(
        tokenModels.flatMap((tokenModel) => {
          const token = tokenModel.address;
          return [
            { contract: Contracts.get(token), method: 'totalSupply', allowFailure: true },
            {
              contract: beanstalk,
              method: 'bdv',
              args: [token, BigInt(10 ** tokenModel.decimals)],
              allowFailure: true
            },
            { contract: beanstalk, method: 'tokenSettings', args: [token], allowFailure: true },
            { contract: beanstalk, method: 'stemTipForToken', args: [token], allowFailure: true },
            { contract: beanstalk, method: 'getTotalDeposited', args: [token], allowFailure: true },
            { contract: beanstalk, method: 'getTotalDepositedBdv', args: [token], allowFailure: true }
          ];
        })
      );

      for (let i = 0; i < tokenModels.length; ++i) {
        const tokenModel = tokenModels[i];
        const token = tokenModel.address;
        const resultIndex = i * 6;
        const supply = multicallResults[resultIndex] ?? null;
        const bdv = multicallResults[resultIndex + 1] ?? 1n;
        const stalkEarnedPerSeason = multicallResults[resultIndex + 2]?.stalkEarnedPerSeason ?? null;
        const stemTip = multicallResults[resultIndex + 3] ?? null;
        const totalDeposited = multicallResults[resultIndex + 4] ?? null;
        const totalDepositedBdv = multicallResults[resultIndex + 5] ?? null;

        updatedTokens.push(
          ...(await TokenRepository.updateToken(token, chain, {
            supply,
            bdv,
            stalkEarnedPerSeason,
            stemTip,
            totalDeposited,
            totalDepositedBdv
          }))
        );
      }
    });
    return updatedTokens;
  }
}

module.exports = SiloService;
