const AlchemyUtil = require('../datasources/alchemy');
const BeanstalkEth = require('./raw/beanstalk-eth');

// Multichain constants:
// ARB.BEANSTALK / ETH.BEANSTALK / ETH.provider, C(chain).BEANSTALK
// OR
// BEANSTALK(chain), provider(chain)

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
// Input can be either a chain string, or an object with `chain` and `block` properties
const C = (opt) => {
  if (opt.chain) {
    return RuntimeConstants.underlying(opt.chain, opt.block);
  } else {
    return RuntimeConstants.underlying(opt);
  }
};

module.exports = {
  C,
  // Not intended for use outside of tests/mocking
  RuntimeConstants
};
