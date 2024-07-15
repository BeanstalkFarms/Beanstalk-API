const { Contract } = require('alchemy-sdk');
const { BEANSTALK, BEANSTALK_PRICE, USD_ORACLE, ABIS } = require('../../constants/addresses.js');
const { providerThenable } = require('../alchemy.js');

const contracts = {};

class Contracts {
  static async getContractAsync(address, blockNumber, provider) {
    const network = (await provider.detectNetwork()).name;
    const key = JSON.stringify({ address, blockNumber, network });
    if (!contracts[key]) {
      contracts[key] = this.makeContract(address, ABIS[address], provider);
    }
    return contracts[key];
  }

  static makeContract(address, abi, provider) {
    return new Contract(address, abi, provider);
  }

  static async asyncBeanstalkContractGetter(blockNumber = 0, providerTh = providerThenable) {
    return this.getContractAsync(BEANSTALK, blockNumber, await providerTh);
  }

  static async asyncPriceV1ContractGetter(blockNumber = 0, providerTh = providerThenable) {
    return this.getContractAsync(BEANSTALK_PRICE, blockNumber, await providerTh);
  }

  static async asyncUsdOracleContractGetter(blockNumber = 0, providerTh = providerThenable) {
    return this.getContractAsync(USD_ORACLE, blockNumber, await providerTh);
  }
}

module.exports = Contracts;
