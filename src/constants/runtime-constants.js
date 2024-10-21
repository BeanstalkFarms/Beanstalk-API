const AlchemyUtil = require('../datasources/alchemy');
const AsyncContext = require('../utils/async/context');
const EnvUtil = require('../utils/env');
const BeanstalkEth = require('./raw/beanstalk-eth');
const BeanstalkArb = require('./raw/beanstalk-arb');
const { isNil } = require('../utils/bigint');

const C_MAPPING = {
  eth: BeanstalkEth,
  arb: BeanstalkArb
};

// Separated into a class such that mocking can be done easily when the simplified `C` object is used.
// i.e. jest.spyOn(RuntimeConstants, 'proxyUnderlying').mockReturnValue(4);
class RuntimeConstants {
  static proxyUnderlying({ chain, season }) {
    if (isNil(chain) && isNil(season)) {
      throw new Error(`One of chain/season must be provided.`);
    }
    return new Proxy({}, RuntimeConstants._makeProxyHandler(chain, season));
  }

  static _makeProxyHandler(chain, season) {
    return {
      get: (target, property, receiver) => {
        if (property === 'RPC') {
          return AlchemyUtil.providerForChain(chain);
        }
        let constants;
        if (chain) {
          constants = C_MAPPING[chain];
        } else {
          constants = RuntimeConstants._constantsForSeason(season);
        }
        let value = constants[property];
        if (!value) {
          // Secondarily search for the property among the addresses
          value = constants.ADDRESSES[property];
        }
        return value;
      }
    };
  }

  static _constantsForSeason(season) {
    for (const constants of Object.values(C_MAPPING)) {
      if (season >= constants.MILESTONE.startSeason && season < constants.MILESTONE.endSeason) {
        return constants;
      }
    }
    throw new Error(`No constants available for season ${season} - constants are misconfigured.`);
  }
}

// Convenience object for succinct usage.
// Input can be any of the following:
// 1. Empty - will use AsyncContext.get('chain')
// 2. A chain string
// 3. A season number
// Example access:
// C().RPC
// C().ABIS[addr]
// C(season).BEANSTALK
// C(chain).DECIMALS[token]
const C = (opt) => {
  if (!opt) {
    let defaultChain = AsyncContext.getOrUndef('chain');
    if (!defaultChain) {
      // If there is no async context, this is from a system process/non rest. Use default configured chain
      defaultChain = EnvUtil.defaultChain();
    }
    return RuntimeConstants.proxyUnderlying({ chain: defaultChain });
  } else if (typeof opt === 'string') {
    return RuntimeConstants.proxyUnderlying({ chain: opt });
  } else if (typeof opt === 'number') {
    return RuntimeConstants.proxyUnderlying({ season: opt });
  }
};

module.exports = {
  C,
  // Not intended for use outside of tests/mocking
  RuntimeConstants
};
