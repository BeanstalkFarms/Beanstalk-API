const { Alchemy } = require('alchemy-sdk');
const EnvUtil = require('../utils/env');

class AlchemyUtil {
  // Contains a provider by chain
  static _providers = {};

  static {
    for (const chain of EnvUtil.getEnabledChains()) {
      const settings = {
        apiKey: EnvUtil.getAlchemyKey(),
        network: `${chain}-mainnet` // Of type alchemy-sdk.Network
      };
      this._providers[chain] = new Alchemy(settings).config.getProvider();
    }
  }

  static async providerForChain(chain) {
    return await AlchemyUtil._providers[chain];
  }
}

module.exports = AlchemyUtil;
