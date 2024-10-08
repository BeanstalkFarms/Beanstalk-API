const { BigNumber } = require('alchemy-sdk');
const { allToBigInt } = require('../../utils/number');

// Proxy wrapper to transform all BigNumber -> BigInt
class BigIntContract {
  constructor(contract) {
    const proxyHandler = {
      get: (target, property, receiver) => {
        if (property === 'then') {
          return undefined;
        }

        return async (...args) => {
          const rawResult = await contract[property](...args);
          if (!Array.isArray(rawResult)) {
            return allToBigInt(rawResult);
          } else {
            // The raw result is frozen
            const transformed = allToBigInt(JSON.parse(JSON.stringify(rawResult)));
            // Re assign the convenience names
            const retval = {};
            const keys = Object.keys(rawResult).filter(isNaN);
            for (let i = 0; i < keys.length; ++i) {
              retval[keys[i]] = transformed[i];
            }
            return retval;
          }
        };
      }
    };

    return new Proxy(this, proxyHandler);
  }
}

module.exports = BigIntContract;
