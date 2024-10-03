const { Contract } = require('alchemy-sdk');
const { C } = require('../../constants/runtime-constants');

const contracts = {};

class Contracts {
  static getDefaultContract(address, c = C()) {
    const network = c.CHAIN;
    const key = JSON.stringify({ address, network });
    if (!contracts[key]) {
      const abi = c.ABIS[address];
      if (!abi) {
        throw new Error(`There is no default ABI for contract ${address}.`);
      }
      contracts[key] = this.makeContract(address, abi, c.RPC);
    }
    return contracts[key];
  }

  static makeContract(address, abi, provider) {
    return new Contract(address, abi, provider);
  }
}

module.exports = Contracts;
