// TODO: multichain solution

const priceMapping = [
  {
    start: 17978222,
    end: 20298142,
    address: '0xb01CE0008CaD90104651d6A84b6B11e182a9B62A',
    abi: require('../abi/BeanstalkPrice.json')
  },
  {
    start: 20298142,
    end: 'latest',
    address: '0x4bed6cb142b7d474242d87f4796387deb9e1e1b4',
    abi: require('../abi/BeanstalkPrice.json')
  }
];

const usdOracleMapping = [
  {
    start: 18466741,
    end: 20334284,
    address: '0x1aa19ed7dfc555e4644c9353ad383c33024855f7',
    abi: require('../abi/UsdOracle1.json')
  },
  {
    start: 20334284,
    end: 'latest',
    address: '0xb24a70b71e4cca41eb114c2f61346982aa774180',
    abi: require('../abi/UsdOracle2.json')
  }
];

module.exports = {
  priceMapping,
  usdOracleMapping
};
