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
      const alchemy = new Alchemy(settings);
      alchemy.config.getProvider().then((p) => {
        this._providers[chain] = p;
      });
    }
  }

  static providerForChain(chain) {
    return AlchemyUtil._providers[chain];
  }
}

module.exports = AlchemyUtil;
