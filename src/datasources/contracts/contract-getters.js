const { BEANSTALK } = require('../../constants/addresses.js');
const { providerThenable } = require('../alchemy.js');
const Contracts = require('./contracts.js');
const UpgradeableContract = require('./upgradeable-contract.js');
const { priceMapping, usdOracleMapping } = require('./upgradeable-mappings.js');

class ContractGetters {
  /// Regular Contracts
  static async asyncBeanstalkContractGetter(blockNumber = 0, providerTh = providerThenable) {
    return Contracts.getContractAsync(BEANSTALK, blockNumber, await providerTh);
  }

  /// Upgradeable Contracts
  static async asyncUsdOracleContractGetter(blockNumber = 'latest', providerTh = providerThenable) {
    return new UpgradeableContract(usdOracleMapping, await providerTh, blockNumber);
  }

  static async asyncPriceContractGetter(blockNumber = 'latest', providerTh = providerThenable) {
    return new UpgradeableContract(priceMapping, await providerTh, blockNumber);
  }
}

module.exports = ContractGetters;
