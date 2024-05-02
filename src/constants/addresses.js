const contracts = {
  BEANSTALK: ['0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5', null, null],
  BEANSTALK_PRICE: ['0xb01CE0008CaD90104651d6A84b6B11e182a9B62A', null, require('../datasources/abi/BeanstalkPriceV1.json')],
  BEAN: ['0xBEA0000029AD1c77D3d5D23Ba2D8893dB9d1Efab', 6, null],
  BEAN3CRV: ['0xc9C32cd16Bf7eFB85Ff14e0c8603cc90F6F2eE49', 18, null],
  BEANWETH: ['0xBEA0e11282e2bB5893bEcE110cF199501e872bAd', 18, null],
  UNRIPE_BEAN: ['0x1BEA0050E63e05FBb5D8BA2f10cf5800B6224449', 6, null],
  UNRIPE_LP: ['0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D', 6, null]
};

const addressesOnly = Object.fromEntries(
  Object.entries(contracts).map(
    ([k, v]) => [k, v[0]]
  )
);

const decimals = Object.fromEntries(
  Object.entries(contracts).map(
    ([k, v]) => [v[0], v[1]]
  )
);

const abis = Object.fromEntries(
  Object.entries(contracts).map(
    ([k, v]) => [v[0], v[2]]
  )
);

module.exports = {
  ...addressesOnly,
  DECIMALS: decimals,
  ABIS: abis
}
