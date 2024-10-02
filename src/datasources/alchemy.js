const { Alchemy } = require('alchemy-sdk');
const EnvUtil = require('../utils/env');

class AlchemyUtil {
  // Contains a provider by chain
  static _providers = {};
  // Access to the underlying promise whos execution populates _providers.
  // Allows flexibility in awaiting when necessary (i.e. once at application startup)
  static _providerPromises = {};

  static {
    for (const chain of EnvUtil.getEnabledChains()) {
      const settings = {
        apiKey: EnvUtil.getAlchemyKey(),
        network: `${chain}-mainnet` // Of type alchemy-sdk.Network
      };
      const alchemy = new Alchemy(settings);
      this._providerPromises = alchemy.config.getProvider().then((p) => {
        this._providers[chain] = p;
      });
    }
  }

  static providerForChain(chain) {
    return AlchemyUtil._providers[chain];
  }

  // Returns immediately if already resolved (and _providers is populated)
  static async ready(chain) {
    await AlchemyUtil._providerPromises[chain];
  }
}

module.exports = AlchemyUtil;
