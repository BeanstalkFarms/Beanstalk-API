const bip45Abi = require('../datasources/abi/Beanstalk-BIP45.json');
const erc20Abi = require('../datasources/abi/ERC20.json');

// Multichain constants:
// ARB.BEANSTALK / ETH.BEANSTALK / ETH.provider, C(chain).BEANSTALK
// OR
// BEANSTALK(chain), provider(chain)

const contracts = {
  BEANSTALK: ['0xC1E088fC1323b20BCBee9bd1B9fC9546db5624C5', null, bip45Abi],
  BEAN: ['0xBEA0000029AD1c77D3d5D23Ba2D8893dB9d1Efab', 6, erc20Abi],
  BEAN3CRV: ['0xc9C32cd16Bf7eFB85Ff14e0c8603cc90F6F2eE49', 18, erc20Abi],
  BEANWETH: ['0xBEA0e11282e2bB5893bEcE110cF199501e872bAd', 18, erc20Abi],
  BEANWSTETH: ['0xBeA0000113B0d182f4064C86B71c315389E4715D', 18, erc20Abi],
  UNRIPE_BEAN: ['0x1BEA0050E63e05FBb5D8BA2f10cf5800B6224449', 6, erc20Abi],
  UNRIPE_LP: ['0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D', 6, erc20Abi],
  WETH: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, erc20Abi],
  WSTETH: ['0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', 18, erc20Abi]
};

const addressesOnly = Object.fromEntries(Object.entries(contracts).map(([k, v]) => [k, v[0].toLowerCase()]));

const decimals = Object.fromEntries(Object.entries(contracts).map(([k, v]) => [v[0].toLowerCase(), v[1]]));

const abis = Object.fromEntries(Object.entries(contracts).map(([k, v]) => [v[0].toLowerCase(), v[2]]));

module.exports = {
  ...addressesOnly,
  DECIMALS: decimals,
  ABIS: abis
};
