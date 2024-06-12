require('dotenv').config();
const { Network, Alchemy } = require('alchemy-sdk');

const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET
};

const alchemy = new Alchemy(settings);

module.exports = {
  alchemy: alchemy,
  providerThenable: alchemy.config.getProvider()
};
