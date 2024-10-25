const { Contract: AlchemyContract } = require('alchemy-sdk');
const { C } = require('../../constants/runtime-constants');
const SuperContract = require('./super-contract');
const wellFunctionAbi = require('../../datasources/abi/basin/WellFunction.json');

class Contracts {
  static _contracts = {};

  static get(address, c = C()) {
    return Contracts._getDefaultContract(address, c);
  }

  static getBeanstalk(c = C()) {
    return Contracts.get(c.BEANSTALK, c);
  }

  static getWellFunction(address, c = C()) {
    return Contracts.makeContract(address, wellFunctionAbi, c.RPC);
  }

  static makeContract(address, abi, provider) {
    const underlyingContract = new AlchemyContract(address, abi, provider);
    return new SuperContract(underlyingContract);
  }

  static _getDefaultContract(address, c = C()) {
    const network = c.CHAIN;
    const key = JSON.stringify({ address, network });
    if (!Contracts._contracts[key]) {
      const abi = c.ABIS[address];
      if (!abi) {
        throw new Error(`There is no default ABI for contract ${address}.`);
      }
      Contracts._contracts[key] = this.makeContract(address, abi, c.RPC);
    }
    return Contracts._contracts[key];
  }
}

module.exports = Contracts;
