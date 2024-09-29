const ContractStorage = require('@beanstalk/contract-storage');
const storageLayout = require('./storage/beanstalk/StorageBIP47.json');
const { getBeanstalkContract } = require('./contracts/contract-getters');
const { C } = require('../constants/runtime-constants');

class EVM {
  // Future work may involve choosing which storage layout based on the block number
  static async beanstalkContractAndStorage(blockNumber = 'latest') {
    return {
      beanstalk: await getBeanstalkContract(blockNumber),
      bs: new ContractStorage(await C().provider, C().BEANSTALK, storageLayout, blockNumber)
    };
  }
}

module.exports = EVM;
