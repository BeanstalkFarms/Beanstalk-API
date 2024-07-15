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

module.exports = {
  priceMapping
};
