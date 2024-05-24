const { Contract } = require('alchemy-sdk');
const { BEANSTALK, BEANSTALK_PRICE, USD_ORACLE, ABIS } = require('../constants/addresses.js');
const { providerThenable } = require('./alchemy.js');

const contracts = {};
async function getContractAsync(address, blockNumber) {
  const key = JSON.stringify({ address, blockNumber });
  if (!contracts[key]) {
    contracts[key] = new Contract(address, ABIS[address], await providerThenable);

    // Future development inclueds adding the option for a local rpc.
    // This does not appear to work with the alchemy-sdk contract, and would therefore
    // require a Proxy object wrapping the contract to bridge the .callStatic property.
    // const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    // contracts[key] = new ethers.Contract(address, ABIS[address], provider);
  }
  return contracts[key];
}

module.exports = {
  asyncBeanstalkContractGetter: async (blockNumber = 0) => getContractAsync(BEANSTALK, blockNumber),
  asyncPriceV1ContractGetter: async (blockNumber = 0) => getContractAsync(BEANSTALK_PRICE, blockNumber),
  asyncUsdOracleContractGetter: async (blockNumber = 0) => getContractAsync(USD_ORACLE, blockNumber),
}
