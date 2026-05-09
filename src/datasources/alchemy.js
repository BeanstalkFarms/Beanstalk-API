const { Alchemy } = require('alchemy-sdk');
const EnvUtil = require('../utils/env');
const { ethers } = require('ethers');
const Log = require('../utils/logging');

const RPC_BATCH_OPTIONS = {
  batchMaxCount: Number(process.env.RPC_BATCH_MAX_COUNT ?? 10),
  batchStallTime: Number(process.env.RPC_BATCH_STALL_TIME_MS ?? 10),
  batchMaxSize: Number(process.env.RPC_BATCH_MAX_SIZE ?? 1024 * 1024)
};
const ETHERS_NETWORKS = {
  eth: { name: 'mainnet', chainId: 1 },
  arb: { name: 'arbitrum', chainId: 42161 }
};

class AlchemyUtil {
  // Contains alchemy object
  static _alchemies = {};
  // Contains a provider by chain
  static _providers = {};
  // Access to the underlying promise whos execution populates _providers.
  // Allows flexibility in awaiting when necessary (i.e. once at application startup)
  static _providerPromises = {};
  static _rpcCounters = {};

  static {
    for (const chain of EnvUtil.getEnabledChains()) {
      if (EnvUtil.getCustomRpcUrl(chain)) {
        this._providers[chain] = this._makeProvider(chain, EnvUtil.getCustomRpcUrl(chain));
      } else {
        const settings = {
          apiKey: EnvUtil.getAlchemyKey(),
          network: `${chain}-mainnet` // Of type alchemy-sdk.Network
        };
        this._alchemies[chain] = new Alchemy(settings);
        this._providers[chain] = this._makeProvider(
          chain,
          `https://${chain}-mainnet.g.alchemy.com/v2/${EnvUtil.getAlchemyKey()}`
        );
      }
    }
  }

  static alchemyForChain(chain) {
    return AlchemyUtil._alchemies[chain];
  }

  static providerForChain(chain) {
    return AlchemyUtil._providers[chain];
  }

  static rpcCounts(chain) {
    return AlchemyUtil._rpcCounters[chain];
  }

  // Returns immediately if already resolved (and _providers is populated)
  static async ready(chain) {
    await AlchemyUtil._providerPromises[chain];
  }

  static _makeProvider(chain, url) {
    const provider = new ethers.JsonRpcProvider(url, ETHERS_NETWORKS[chain], RPC_BATCH_OPTIONS);
    // Needed to get the alchemy-sdk Contract constructor to work with an ethers v6 provider.
    provider._isProvider = true;
    return AlchemyUtil._withRequestCounter(chain, provider);
  }

  static _withRequestCounter(chain, provider) {
    if (process.env.LOG_RPC !== '1' || !provider._send) {
      return provider;
    }

    const counter = {
      total: 0,
      methods: {}
    };
    AlchemyUtil._rpcCounters[chain] = counter;

    const originalSend = provider._send.bind(provider);
    provider._send = async (payload) => {
      const requests = Array.isArray(payload) ? payload : [payload];
      for (const request of requests) {
        counter.total++;
        counter.methods[request.method] = (counter.methods[request.method] ?? 0) + 1;
      }
      return await originalSend(payload);
    };

    let didLog = false;
    const logCounts = () => {
      if (didLog) {
        return;
      }
      didLog = true;
      Log.info(`RPC request counts for ${chain}`, JSON.stringify(counter));
    };
    process.once('beforeExit', logCounts);
    process.once('exit', logCounts);
    process.once('SIGINT', () => {
      logCounts();
      process.exit(0);
    });
    process.once('SIGTERM', () => {
      logCounts();
      process.exit(0);
    });
    return provider;
  }
}

module.exports = AlchemyUtil;
