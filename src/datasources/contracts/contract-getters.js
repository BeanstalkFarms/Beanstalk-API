const { C } = require('../../constants/runtime-constants.js');
const Contracts = require('./contracts.js');
const UpgradeableContract = require('./upgradeable-contract.js');
const { priceMapping, usdOracleMapping } = require('./upgradeable-mappings.js');

class ContractGetters {
  // Uses the default specified abi for this address
  static async get(address, blockNumber = 0, c = C()) {
    return await Contracts.getContractAsync(address, blockNumber, c.RPC);
  }

  static async getBeanstalk(blockNumber = 0, c = C()) {
    return ContractGetters.get(c.BEANSTALK, blockNumber, c);
  }

  /// Upgradeable Contracts
  static async getUsdOracleUpgradeable(blockNumber = 'latest', c = C()) {
    return new UpgradeableContract(usdOracleMapping, c.RPC, blockNumber);
  }

  static async getPriceUpgradeable(blockNumber = 'latest', c = C()) {
    return new UpgradeableContract(priceMapping, c.RPC, blockNumber);
  }
}

module.exports = ContractGetters;
