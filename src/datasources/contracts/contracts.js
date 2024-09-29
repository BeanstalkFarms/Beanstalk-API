const { Contract } = require('alchemy-sdk');
const { C } = require('../../constants/runtime-constants');

const contracts = {};

class Contracts {
  static async getContractAsync(address, blockNumber, provider) {
    const network = (await provider.detectNetwork()).name;
    const key = JSON.stringify({ address, blockNumber, network });
    if (!contracts[key]) {
      contracts[key] = this.makeContract(address, C().ABIS[address], provider);
    }
    return contracts[key];
  }

  static makeContract(address, abi, provider) {
    return new Contract(address, abi, provider);
  }
}

module.exports = Contracts;
