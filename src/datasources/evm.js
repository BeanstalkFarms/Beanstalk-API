const ContractStorage = require('@beanstalk/contract-storage');
const storageLayout = require('./storage/beanstalk/StorageBIP47.json');
const { getBeanstalk } = require('./contracts/contract-getters');
const { C } = require('../constants/runtime-constants');

class EVM {
  // Future work may involve choosing which storage layout based on the block number
  static async beanstalkContractAndStorage(blockNumber = 'latest') {
    return {
      beanstalk: await getBeanstalk(blockNumber),
      bs: new ContractStorage(C().RPC, C().BEANSTALK, storageLayout, blockNumber)
    };
  }
}

module.exports = EVM;
