const { Contract } = require('alchemy-sdk');
const { BEANSTALK, BEANSTALK_PRICE, USD_ORACLE, ABIS } = require('../constants/addresses.js');
const { providerThenable } = require('./alchemy.js');

const contracts = {};
async function getContractAsync(address, blockNumber) {
  const key = JSON.stringify({ address, blockNumber });
  if (!contracts[key]) {
    contracts[key] = new Contract(address, ABIS[address], await providerThenable);
  }
  return contracts[key];
}

module.exports = {
  asyncBeanstalkContractGetter: async (blockNumber = 0) => getContractAsync(BEANSTALK, blockNumber),
  asyncPriceV1ContractGetter: async (blockNumber = 0) => getContractAsync(BEANSTALK_PRICE, blockNumber),
  asyncUsdOracleContractGetter: async (blockNumber = 0) => getContractAsync(USD_ORACLE, blockNumber),
}
