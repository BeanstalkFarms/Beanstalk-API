const { BigNumber } = require('alchemy-sdk');

const ZERO_BN = BigNumber.from(0);
const TEN_BN = BigNumber.from(10);

const MILESTONE = {
  siloV3: 17671557
};

const PRECISION = {
  bdv: 6,
  seeds: 6,
  stalk: 10,
  gaugePoints: 18,
  beanToMaxLpGpPerBdvRatio: 20,
  optimalPercentDepositedBdv: 6
};

Object.freeze(MILESTONE);
Object.freeze(PRECISION);

module.exports = {
  ZERO_BN,
  TEN_BN,
  MILESTONE,
  PRECISION
};
