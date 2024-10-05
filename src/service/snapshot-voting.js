const { C } = require('../constants/runtime-constants');
const Contracts = require('../datasources/contracts/contracts');
const SnapshotSubgraphRepository = require('../repository/subgraph/snapshot-subgraph');
const PromiseUtil = require('../utils/promise');

class SnapshotVotingService {
  // Returns a list of voting powers by requested address
  static async getVotingPower(addresses, blockNumber) {
    const results = [];
    const voterAccounts = {};
    addresses = addresses.map((a) => a.toLowerCase());

    // Assumption is that arb is the active chain - switch the undefined/blockNumber to change this.
    const [ethDelegations, arbDelegations] = await Promise.all([
      SnapshotSubgraphRepository.getDelegations('eth', undefined),
      SnapshotSubgraphRepository.getDelegations('arb', blockNumber)
    ]);
    const allDelegations = [...ethDelegations, ...arbDelegations];

    // Determine all accounts for which the stalk balance needs to be queried
    const allRelevantAccounts = [];
    const functions = [];
    for (const address of addresses) {
      functions.push(async () => {
        const delegators = allDelegations.filter((d) => d.delegate === address);
        const isDelegator = allDelegations.some((d) => d.delegator === address);
        voterAccounts[address] = [...new Set([...(isDelegator ? [] : [address]), ...delegators])];
        allRelevantAccounts.push(...voterAccounts[address]);
      });
    }
    await PromiseUtil.runBatchPromises(functions, 20);

    // Get stalk balance of all relevant accounts
    const stalkBalances = await SnapshotVotingService._getStalkBalances(allRelevantAccounts, blockNumber);

    for (const address of addresses) {
      const votingPower = voterAccounts[address].reduce((acc, next) => {
        return acc + stalkBalances[next];
      }, 0n);
      const stalkholders = Object.fromEntries(
        voterAccounts[address].map((a) => [a, Number(stalkBalances[a] / BigInt(10 ** C().DECIMALS.stalk))])
      );
      results.push({
        address,
        score: Number(votingPower / BigInt(10 ** C().DECIMALS.stalk)),
        stalkholders
      });
    }
    return results;
  }

  // Returns the stalk balance of each account, according to balanceOfStalk view function
  static async _getStalkBalances(accounts, blockNumber) {
    const beanstalk = Contracts.getBeanstalk();
    const functions = [];
    for (const account of accounts) {
      functions.push(async () => ({
        account,
        stalk: BigInt(await beanstalk.balanceOfStalk(account, { blockTag: blockNumber }))
      }));
    }
    const results = {};
    await PromiseUtil.runBatchPromises(functions, 50, (result) => {
      results[result.account] = result.stalk;
    });
    return results;
  }
}

module.exports = SnapshotVotingService;
