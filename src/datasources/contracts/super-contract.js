const { allToBigInt } = require('../../utils/number');
const retryable = require('../../utils/async/retryable');

// Proxy wrapper to:
// (1) built in retry support for failed requests
// (2) transform all BigNumber -> BigInt
class SuperContract {
  constructor(contract) {
    const proxyHandler = {
      get: (target, property, receiver) => {
        if (['interface', 'provider', 'filters', 'address'].includes(property)) {
          return contract[property];
        }

        if (property === 'then') {
          return undefined;
        }

        return async (...args) => {
          const rawResult = await retryable(() => contract[property](...args));
          return SuperContract._transformAll(rawResult);
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

module.exports = SuperContract;
