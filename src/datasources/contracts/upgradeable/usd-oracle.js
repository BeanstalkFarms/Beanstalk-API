const { C } = require('../../../constants/runtime-constants');
const Contracts = require('../contracts');

// TODO: add chain/beanstalk 3
const mapping = [
  {
    chain: 'eth',
    start: 18466741,
    end: 20334284,
    address: '0x1aa19ed7dfc555e4644c9353ad383c33024855f7',
    abi: require('../../abi/UsdOracle1.json')
  },
  {
    chain: 'eth',
    start: 20334284,
    end: 'latest',
    address: '0xb24a70b71e4cca41eb114c2f61346982aa774180',
    abi: require('../../abi/UsdOracle2.json')
  }
];

class UsdOracle {
  constructor({ block = 'latest', c = C() }) {
    this.contract = Contracts.getUpgradeableContract(mapping, c, block);
  }

  async getTokenUsdPrice(token) {
    // Logic for versions 2 and 3 is the same, but version 3 is the beanstalk contract.
    const result =
      this.contract.__version() === 1
        ? BigInt(await this.contract.getUsdPrice(token))
        : BigInt(await this.contract.getTokenUsdPrice(token));
    // Version 1 returned a twa price, but with no lookback. Its already instantaneous but needs conversion
    const instPrice = this.contract.__version() === 1 ? BigInt(10 ** 24) / result : result;
    return instPrice;
  }
}

module.exports = UsdOracle;