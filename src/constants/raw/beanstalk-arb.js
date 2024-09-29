// ** DO NOT USE ANY OF THESE EXPORTS DIRECTLY. USE `C` IN runtime-constants.js ** //

// TODO: use bip-50
const bip45Abi = require('../../datasources/abi/beanstalk/Beanstalk-BIP45.json');
const erc20Abi = require('../../datasources/abi/ERC20.json');
const wellFunctionAbi = require('../../datasources/abi/basin/WellFunction.json');

const contracts = {
  BEANSTALK: ['0xD1A0060ba708BC4BCD3DA6C37EFa8deDF015FB70', null, bip45Abi],
  BEAN: ['0xBEA0005B8599265D41256905A9B3073D397812E4', 6, erc20Abi],
  UNRIPE_BEAN: ['0x1BEA054dddBca12889e07B3E076f511Bf1d27543', 6, erc20Abi],
  UNRIPE_LP: ['0x1BEA059c3Ea15F6C10be1c53d70C75fD1266D788', 6, erc20Abi],
  BEANWETH: ['0xBEA00A3F7aaF99476862533Fe7DcA4b50f6158cB', 18, erc20Abi],
  BEANWSTETH: ['0xBEA0093f626Ce32dd6dA19617ba4e7aA0c3228e8', 18, erc20Abi],
  BEANWEETH: ['0xBEA00865405A02215B44eaADB853d0d2192Fc29D', 18, erc20Abi],
  BEANWBTC: ['0xBEA008aC57c2bEfe82E87d1D8Fb9f4784d0B73cA', 18, erc20Abi],
  BEANUSDC: ['0xBEA00dAf62D5549D265c5cA6D6BE87eF17881279', 18, erc20Abi],
  BEANUSDT: ['0xBEA00bE150FEF7560A8ff3C68D07387693Ddfd0b', 18, erc20Abi],
  WETH: ['0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 18, erc20Abi],
  WSTETH: ['0x5979D7b546E38E414F7E9822514be443A4800529', 18, erc20Abi],
  WEETH: ['0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe', 18, erc20Abi],
  WBTC: ['0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', 18, erc20Abi],
  USDC: ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 18, erc20Abi],
  USDT: ['0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 18, erc20Abi],
  CP2: ['0xBA5104f2df98974A83CD10d16E24282ce6Bb647f', null, wellFunctionAbi],
  STABLE2: ['0xBA51055Ac3068Ffd884B495BF58314493cde9653', null, wellFunctionAbi]
};

// Extract values from the above contracts
const ADDRESSES = Object.fromEntries(Object.entries(contracts).map(([k, v]) => [k, v[0].toLowerCase()]));
const decimals = Object.fromEntries(Object.entries(contracts).map(([k, v]) => [v[0].toLowerCase(), v[1]]));
const ABIS = Object.fromEntries(Object.entries(contracts).map(([k, v]) => [v[0].toLowerCase(), v[2]]));

const DECIMALS = {
  ...decimals,
  bdv: 6,
  seeds: 6,
  stalk: 16,
  gaugePoints: 18,
  beanToMaxLpGpPerBdvRatio: 20,
  optimalPercentDepositedBdv: 6
};

const MILESTONE = {};

Object.freeze(ADDRESSES);
Object.freeze(DECIMALS);
Object.freeze(ABIS);
Object.freeze(MILESTONE);

// ** DO NOT USE ANY OF THESE EXPORTS DIRECTLY. USE `C` IN runtime-constants.js ** //
module.exports = {
  CHAIN: 'arb',
  ADDRESSES,
  DECIMALS,
  ABIS,
  MILESTONE
};
