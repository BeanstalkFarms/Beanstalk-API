const contracts = {
  BEANSTALK: ['0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5', null, require('../datasources/abi/Beanstalk-BIP44.json')],
  BEANSTALK_PRICE: ['0xb01CE0008CaD90104651d6A84b6B11e182a9B62A', null, require('../datasources/abi/BeanstalkPriceV1.json')],
  USD_ORACLE: ['0x1aa19ed7DfC555E4644c9353Ad383c33024855F7', null, require('../datasources/abi/UsdOracle.json')],
  BEAN: ['0xBEA0000029AD1c77D3d5D23Ba2D8893dB9d1Efab', 6, null],
  BEAN3CRV: ['0xc9C32cd16Bf7eFB85Ff14e0c8603cc90F6F2eE49', 18, null],
  BEANWETH: ['0xBEA0e11282e2bB5893bEcE110cF199501e872bAd', 18, null],
  UNRIPE_BEAN: ['0x1BEA0050E63e05FBb5D8BA2f10cf5800B6224449', 6, null],
  UNRIPE_LP: ['0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D', 6, null],
  WETH: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, null],
};

const addressesOnly = Object.fromEntries(
  Object.entries(contracts).map(
    ([k, v]) => [k, v[0].toLowerCase()]
  )
);

const decimals = Object.fromEntries(
  Object.entries(contracts).map(
    ([k, v]) => [v[0].toLowerCase(), v[1]]
  )
);

const abis = Object.fromEntries(
  Object.entries(contracts).map(
    ([k, v]) => [v[0].toLowerCase(), v[2]]
  )
);

module.exports = {
  ...addressesOnly,
  DECIMALS: decimals,
  ABIS: abis
}
