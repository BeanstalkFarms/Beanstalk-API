const { C } = require('../../constants/runtime-constants.js');
const Contracts = require('./contracts.js');
const UpgradeableContract = require('./upgradeable-contract.js');
const { priceMapping, usdOracleMapping } = require('./upgradeable-mappings.js');

class ContractGetters {
  /// Regular Contracts
  static async getBeanstalkContract(blockNumber = 0, c = C()) {
    return await Contracts.getContractAsync(C().BEANSTALK, blockNumber, c.RPC);
  }

  // TODO: refactor these to "getDefaultContract" or something similar, where no abi is provided.
  static async getERC20Contract(token, blockNumber = 0, c = C()) {
    return await Contracts.getContractAsync(token, blockNumber, c.RPC);
  }

  static async getWellFunctionContract(address, blockNumber = 0, c = C()) {
    return await Contracts.getContractAsync(address, blockNumber, c.RPC);
  }

  /// Upgradeable Contracts
  static async getUsdOracleContract(blockNumber = 'latest', c = C()) {
    return new UpgradeableContract(usdOracleMapping, c.RPC, blockNumber);
  }

  static async getPriceContract(blockNumber = 'latest', c = C()) {
    return new UpgradeableContract(priceMapping, c.RPC, blockNumber);
  }
}

module.exports = ContractGetters;
