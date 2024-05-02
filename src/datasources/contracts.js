const { Contract } = require('alchemy-sdk');
const { BEANSTALK_PRICE, ABIS } = require('../constants/addresses.js');
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
  asyncPriceV1ContractGetter: async () => getContractAsync(BEANSTALK_PRICE, 0),
}
