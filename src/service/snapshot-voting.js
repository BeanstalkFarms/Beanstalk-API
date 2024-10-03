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

    // Determine all accounts for which the stalk balance needs to be queried
    const allRelevantAccounts = [];
    for (const address of addresses) {
      // Assumption is that arb is the active chain - switch the undefined/blockNumber to change this.
      const ethDelegators = await SnapshotSubgraphRepository.getDelegations(address, 'eth', undefined);
      const arbDelegators = await SnapshotSubgraphRepository.getDelegations(address, 'arb', blockNumber);
      voterAccounts[address] = [...new Set([address, ...ethDelegators, ...arbDelegators])];
      allRelevantAccounts.push(...voterAccounts[address]);
    }

    // Get stalk balance of all relevant accounts
    const stalkBalances = await SnapshotVotingService._getStalkBalances(allRelevantAccounts, blockNumber);

    for (const address of addresses) {
      let votingPower = voterAccounts[address].reduce((acc, next) => {
        return acc + stalkBalances[next];
      }, 0n);
      results.push({
        address,
        score: Number(votingPower / BigInt(10 ** C().DECIMALS.stalk))
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
