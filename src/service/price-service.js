const BlockUtil = require('../utils/block');
const { createNumberSpread } = require('../utils/number');
const { C } = require('../constants/runtime-constants');
const BeanstalkPrice = require('../datasources/contracts/upgradeable/beanstalk-price');
const UsdOracle = require('../datasources/contracts/upgradeable/usd-oracle');

class PriceService {
  // Gets the price of the requested token
  static async getTokenPrice(token, options = {}) {
    const priceFunction = PriceService.#getPriceFunction(token);
    return await priceFunction.call(null, options);
  }

  // Gets the price of bean as returned by the canonical price contract.
  static async getBeanPrice(options = {}) {
    const block = await BlockUtil.blockFromOptions(options);
    const beanstalkPrice = new BeanstalkPrice({ block: block.number });
    const priceResult = await beanstalkPrice.price();

    // Convert from hex to a readable format. For now the pool prices are omitted
    const readable = {
      block: block.number,
      timestamp: block.timestamp,
      token: C().BEAN,
      usdPrice: createNumberSpread(BigInt(priceResult.price), 6, 4).float,
      liquidityUSD: createNumberSpread(BigInt(priceResult.liquidity), 6, 2).float,
      deltaB: createNumberSpread(BigInt(priceResult.deltaB), 6, 0).float
    };
    return readable;
  }

  // In practice, current implementation of getUsdPrice can only get the wsteth/eth price
  static async getUsdOracleTokenPrice(token, options = {}) {
    const block = await BlockUtil.blockFromOptions(options);
    const usdOracle = new UsdOracle({ block: block.number });
    const instPrice = await usdOracle.getTokenUsdPrice(token);

    const readable = {
      block: block.number,
      timestamp: block.timestamp,
      token,
      usdPrice: createNumberSpread(instPrice, 6, 2).float
    };
    return readable;
  }

  static #getPriceFunction(token) {
    if (token === C().BEAN) {
      return PriceService.getBeanPrice;
    } else if ([C().WETH, C().WSTETH].includes(token)) {
      return (options) => PriceService.getUsdOracleTokenPrice(token, options);
    }
    return () => ({
      token: token,
      usdPrice: 0
    });
    // throw new Error('Price not implemented for the requested token.');
  }
}

module.exports = PriceService;
