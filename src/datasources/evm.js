const ContractStorage = require('@beanstalk/contract-storage');
const storageLayout = require('./storage/beanstalk/StorageBIP50.json');
const ContractGetters = require('./contracts/contract-getters');
const { C } = require('../constants/runtime-constants');

class EVM {
  // Future work may involve using upgradeable contract/storage layout by block/chain
  static async beanstalkContractAndStorage(blockNumber = 'latest') {
    return {
      beanstalk: await ContractGetters.getBeanstalk(),
      bs: new ContractStorage(C().RPC, C().BEANSTALK, storageLayout, blockNumber)
    };
  }
}

module.exports = EVM;
