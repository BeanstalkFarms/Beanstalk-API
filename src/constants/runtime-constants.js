const AlchemyUtil = require('../datasources/alchemy');
const AsyncContext = require('../utils/context');
const EnvUtil = require('../utils/env');
const BeanstalkEth = require('./raw/beanstalk-eth');

// C(chain).BEANSTALK
// C(chain).ABIS[addr]
// C(chain).DECIMALS[token]
// C(chain).provider

// Separated into a class such that mocking can be done easily when the simplified `C` object is used.
// i.e. jest.spyOn(RuntimeConstants, 'underlying').mockReturnValue(4);
class RuntimeConstants {
  static underlying(chain, block = undefined) {
    return new Proxy({}, RuntimeConstants.makeProxyHandler(chain, block));
  }

  static makeProxyHandler(chain, block = undefined) {
    return {
      get: (target, property, receiver) => {
        if (property === 'provider') {
          return AlchemyUtil.providerForChain(chain);
        }
        // TODO: orchestrate constants, unclear what is chain paramter (+ set beanstalkarb)
        const constants = chain === 'eth' ? BeanstalkEth : BeanstalkEth; /** */

        let value = constants[property];
        if (!value) {
          // Secondarily search for the property among the addresses
          value = constants.ADDRESSES[property];
        }
        return value;
      }
    };
  }
}

// Convenience object for succinct usage.
// Input can be any of the following:
// 1. Empty - will use AsyncContext.get('chain')
// 2. A chain string
// 3. An object with `chain` and (optionally) `block` properties
// TODO: should also accept a season.
const C = (opt) => {
  if (!opt) {
    let defaultChain;
    try {
      defaultChain = AsyncContext.get('chain');
    } catch (e) {
      // If there is no async context, this is from a system process/non rest. Use default configured chain
      defaultChain = EnvUtil.defaultChain();
    }
    return RuntimeConstants.underlying(defaultChain);
  } else if (!opt.chain) {
    return RuntimeConstants.underlying(opt);
  } else {
    return RuntimeConstants.underlying(opt.chain, opt.block);
  }
};

module.exports = {
  C,
  // Not intended for use outside of tests/mocking
  RuntimeConstants
};
