const { BEANSTALK, USD_ORACLE } = require('../../constants/addresses.js');
const { providerThenable } = require('../alchemy.js');
const Contracts = require('./contracts.js');
const UpgradeableContract = require('./upgradeable-contract.js');
const { priceMapping } = require('./upgradeable-mappings.js');

class ContractGetters {
  /// Regular Contracts
  static async asyncBeanstalkContractGetter(blockNumber = 0, providerTh = providerThenable) {
    return Contracts.getContractAsync(BEANSTALK, blockNumber, await providerTh);
  }

  static async asyncUsdOracleContractGetter(blockNumber = 0, providerTh = providerThenable) {
    return Contracts.getContractAsync(USD_ORACLE, blockNumber, await providerTh);
  }

  /// Upgradeable Contracts
  static async asyncPriceContractGetter(blockNumber = 'latest', providerTh = providerThenable) {
    return new UpgradeableContract(priceMapping, await providerTh, blockNumber);
  }
}

module.exports = ContractGetters;
