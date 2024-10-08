const { C } = require('../../../constants/runtime-constants');
const UpgradeableContract = require('../upgradeable-contract');

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
    end: 20921738,
    address: '0xb24a70b71e4cca41eb114c2f61346982aa774180',
    abi: require('../../abi/UsdOracle2.json')
  },
  {
    chain: 'arb',
    start: 202981420, // TODO: unpause block on L2
    end: 'latest',
    address: '0xD1A0060ba708BC4BCD3DA6C37EFa8deDF015FB70',
    abi: require('../../abi/beanstalk/Beanstalk-BIP50.json')
  }
];

class UsdOracle {
  constructor({ block = 'latest', c = C() } = {}) {
    this.contract = UpgradeableContract.make(mapping, c, block);
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
