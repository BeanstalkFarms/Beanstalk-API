const { C } = require('../constants/runtime-constants');
const Contracts = require('../datasources/contracts/contracts');

class SnapshotVotingService {
  // Returns a list of voting powers by requested address
  static async getVotingPower(addresses, blockNumber) {
    const results = [];
    const beanstalk = Contracts.getBeanstalk();
    for (const address of addresses) {
      const accountStalk = BigInt(await beanstalk.balanceOfStalk(address, { blockTag: blockNumber }));
      console.log(accountStalk);
      results.push({
        address,
        score: accountStalk / BigInt(10 ** C().DECIMALS.stalk)
      });
    }
    return results;
  }
}

module.exports = SnapshotVotingService;
