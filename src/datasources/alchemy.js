require('dotenv').config();
const { Network, Alchemy } = require('alchemy-sdk');

// TODO: configured networks in .env, setup for each
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET
};

const alchemy = new Alchemy(settings);

module.exports = {
  alchemy: alchemy,
  providerThenable: alchemy.config.getProvider()
};
