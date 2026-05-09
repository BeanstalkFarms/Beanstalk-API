const crypto = require('crypto');

const BIGINT_PREFIX = 'bigint:';

class RpcCache {
  static _redisClient;

  static wrapContract(contract, address) {
    return new Proxy(contract, {
      get(target, property, receiver) {
        if (typeof property !== 'string') {
          return target[property];
        }
        if (['interface', 'provider', 'filters', 'address', 'then'].includes(property)) {
          return target[property];
        }

        return async (...args) => {
          const cache = RpcCache._cacheRequest(address, property, args);
          if (!cache) {
            return await target[property](...args);
          }

          const cachedValue = await RpcCache._get(cache.key);
          if (cachedValue !== null) {
            return RpcCache._deserialize(cachedValue);
          }

          const result = await target[property](...args);
          await RpcCache._set(cache.key, RpcCache._serialize(result));
          return result;
        };
      }
    });
  }

  static _cacheRequest(address, method, args) {
    const superArgsIndex = args.findIndex((a) => a?.target === 'SuperContract');
    const superOptions = superArgsIndex === -1 ? null : args[superArgsIndex];
    if (superOptions?.skipTransform) {
      return null;
    }

    const contractArgs = args.filter((_, idx) => idx !== superArgsIndex);
    const callOptions = contractArgs.find((a) => a && typeof a === 'object' && a.blockTag !== undefined);
    const blockTag = callOptions?.blockTag;
    if (!RpcCache._isHistoricalBlockTag(blockTag)) {
      return null;
    }

    return {
      key: `rpc:${address.toLowerCase()}:${method}:${RpcCache._hash({ args: contractArgs, blockTag })}`
    };
  }

  static _isHistoricalBlockTag(blockTag) {
    if (typeof blockTag === 'number' || typeof blockTag === 'bigint') {
      return true;
    }
    return typeof blockTag === 'string' && /^0x[0-9a-f]+$/i.test(blockTag);
  }

  static async _get(key) {
    try {
      return await RpcCache._client().get(key);
    } catch (e) {
      return null;
    }
  }

  static async _set(key, value) {
    try {
      await RpcCache._client().set(key, value);
    } catch (e) {}
  }

  static _client() {
    RpcCache._redisClient ??= require('./redis-client');
    return RpcCache._redisClient;
  }

  static _hash(value) {
    return crypto.createHash('sha256').update(RpcCache._serialize(value)).digest('hex');
  }

  static _serialize(value) {
    return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? `${BIGINT_PREFIX}${v.toString()}` : v));
  }

  static _deserialize(value) {
    return JSON.parse(value, (_, v) => {
      if (typeof v === 'string' && v.startsWith(BIGINT_PREFIX)) {
        return BigInt(v.slice(BIGINT_PREFIX.length));
      }
      return v;
    });
  }
}

module.exports = RpcCache;
