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
          return BigIntContract._transformAll(rawResult);
        };
      }
    };

    return new Proxy(this, proxyHandler);
  }

  // Transforms everything in this result to be a BigInt.
  // Handles arrays/tuples (with named fields), and single values
  static _transformAll(rawResult) {
    if (!Array.isArray(rawResult)) {
      return allToBigInt(rawResult);
    } else {
      // The raw result is frozen
      const transformed = allToBigInt(JSON.parse(JSON.stringify(rawResult)));
      // Re assign the convenience names if the return value was tuple
      const namedKeys = Object.keys(rawResult).filter(isNaN);
      if (namedKeys.length > 0) {
        const retval = {};
        for (let i = 0; i < namedKeys.length; ++i) {
          retval[namedKeys[i]] = transformed[i];
        }
        return retval;
      } else {
        // expected result is an array
        return transformed;
      }
    }
  }
}

module.exports = BigIntContract;
