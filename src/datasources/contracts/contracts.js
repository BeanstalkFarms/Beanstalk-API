const { Contract } = require('alchemy-sdk');
const { C } = require('../../constants/runtime-constants');

const contracts = {};

class Contracts {
  static getDefaultContract(address, c = C()) {
    const network = c.CHAIN;
    const key = JSON.stringify({ address, network });
    if (!contracts[key]) {
      contracts[key] = this.makeContract(address, c.ABIS[address], c.RPC);
    }
    return contracts[key];
  }

  static makeContract(address, abi, provider) {
    return new Contract(address, abi, provider);
  }
}

module.exports = Contracts;
