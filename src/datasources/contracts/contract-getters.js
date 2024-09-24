const { BEANSTALK } = require('../../constants/addresses.js');
const { providerThenable } = require('../alchemy.js');
const Contracts = require('./contracts.js');
const UpgradeableContract = require('./upgradeable-contract.js');
const { priceMapping, usdOracleMapping } = require('./upgradeable-mappings.js');
const wellFunctionAbi = require('../abi/well-function.json');

class ContractGetters {
  /// Regular Contracts
  static async getBeanstalkContract(blockNumber = 0, providerTh = providerThenable) {
    return await Contracts.getContractAsync(BEANSTALK, blockNumber, await providerTh);
  }

  static async getERC20Contract(token, blockNumber = 0, providerTh = providerThenable) {
    return await Contracts.getContractAsync(token, blockNumber, await providerTh);
  }

  static async getWellFunctionContract(address, providerTh = providerThenable) {
    return Contracts.makeContract(address, wellFunctionAbi, await providerTh);
  }

  /// Upgradeable Contracts
  static async getUsdOracleContract(blockNumber = 'latest', providerTh = providerThenable) {
    return new UpgradeableContract(usdOracleMapping, await providerTh, blockNumber);
  }

  static async getPriceContract(blockNumber = 'latest', providerTh = providerThenable) {
    return new UpgradeableContract(priceMapping, await providerTh, blockNumber);
  }
}

module.exports = ContractGetters;
