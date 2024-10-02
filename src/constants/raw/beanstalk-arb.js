// ** DO NOT USE ANY OF THESE EXPORTS DIRECTLY. USE `C` IN runtime-constants.js ** //

const EnvUtil = require('../../utils/env');
const SubgraphClients = require('../../datasources/subgraph-client');

const bip50Abi = require('../../datasources/abi/beanstalk/Beanstalk-BIP50.json');
const erc20Abi = require('../../datasources/abi/ERC20.json');
const wellAbi = require('../../datasources/abi/basin/Well.json');
const wellFunctionAbi = require('../../datasources/abi/basin/WellFunction.json');

const contracts = {
  BEANSTALK: ['0xD1A0060ba708BC4BCD3DA6C37EFa8deDF015FB70', null, bip50Abi],
  BEAN: ['0xBEA0005B8599265D41256905A9B3073D397812E4', 6, erc20Abi],
  UNRIPE_BEAN: ['0x1BEA054dddBca12889e07B3E076f511Bf1d27543', 6, erc20Abi],
  UNRIPE_LP: ['0x1BEA059c3Ea15F6C10be1c53d70C75fD1266D788', 6, erc20Abi],
  BEANWETH: ['0xBeA00Aa8130aCaD047E137ec68693C005f8736Ce', 18, wellAbi],
  BEANWSTETH: ['0xBEa00BbE8b5da39a3F57824a1a13Ec2a8848D74F', 18, wellAbi],
  BEANWEETH: ['0xBeA00Cc9F93E9a8aC0DFdfF2D64Ba38eb9C2e48c', 18, wellAbi],
  BEANWBTC: ['0xBea00DDe4b34ACDcB1a30442bD2B39CA8Be1b09c', 18, wellAbi],
  BEANUSDC: ['0xBea00ee04D8289aEd04f92EA122a96dC76A91bd7', 18, wellAbi],
  BEANUSDT: ['0xbEA00fF437ca7E8354B174339643B4d1814bED33', 18, wellAbi],
  WETH: ['0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 18, erc20Abi],
  WSTETH: ['0x5979D7b546E38E414F7E9822514be443A4800529', 18, erc20Abi],
  WEETH: ['0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe', 18, erc20Abi],
  WBTC: ['0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', 18, erc20Abi],
  USDC: ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 18, erc20Abi],
  USDT: ['0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 18, erc20Abi],
  CP2: ['0xbA1500c28C8965521f47F17Fc21A7829D6E1343e', null, wellFunctionAbi],
  STABLE2: ['0xba150052e11591D0648b17A0E608511874921CBC', null, wellFunctionAbi]
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

const MILESTONE = {
  startSeason: 30000, // TODO: set this to the pause season +1 (the first season to occur on L2)
  endSeason: 99999999,
  isGaugeEnabled: ({ season, block }) => true
};

const SG = EnvUtil.getSG('arb');
SG.BEANSTALK = SubgraphClients.namedSG(SG.BEANSTALK);
SG.BEAN = SubgraphClients.namedSG(SG.BEAN);
SG.BASIN = SubgraphClients.namedSG(SG.BASIN);

Object.freeze(ADDRESSES);
Object.freeze(DECIMALS);
Object.freeze(ABIS);
Object.freeze(MILESTONE);
Object.freeze(SG);

// ** DO NOT USE ANY OF THESE EXPORTS DIRECTLY. USE `C` IN runtime-constants.js ** //
module.exports = {
  CHAIN: 'arb',
  ADDRESSES,
  DECIMALS,
  ABIS,
  MILESTONE,
  SG
};
