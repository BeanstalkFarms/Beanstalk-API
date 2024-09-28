require('dotenv').config();
const { Alchemy } = require('alchemy-sdk');

class AlchemyUtil {
  // Contains a provider by chain
  static _providers = {};

  static {
    const enabledChains = process.env.ENABLED_CHAINS?.split(',');
    for (const chain of enabledChains) {
      const settings = {
        apiKey: process.env.ALCHEMY_API_KEY,
        network: `${chain}-mainnet` // Of type alchemy-sdk.Network
      };
      this._providers[chain] = new Alchemy(settings).config.getProvider();
    }
  }

  static providerForChain(chain) {
    return AlchemyUtil._providers[chain];
  }
}

module.exports = AlchemyUtil;
