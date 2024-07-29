const BlockUtil = require('../utils/block');
const { createNumberSpread } = require('../utils/number');
const { BEAN, WETH, WSTETH } = require('../constants/addresses');
const { TEN_BN } = require('../constants/constants');
const ContractGetters = require('../datasources/contracts/contract-getters');

class PriceService {
  // Gets the price of the requested token
  static async getTokenPrice(token, options = {}) {
    const priceFunction = PriceService.#getPriceFunction(token);
    return await priceFunction.call(null, options);
  }

  // Gets the price of bean as returned by the canonical price contract.
  static async getBeanPrice(options = {}) {
    const block = await BlockUtil.blockFromOptions(options);
    const priceContract = await ContractGetters.getPriceContract(block.number);
    const priceResult = await priceContract.callStatic.price();

    // Convert from hex to a readable format. For now the pool prices are omitted
    const readable = {
      block: block.number,
      timestamp: block.timestamp,
      token: BEAN,
      usdPrice: createNumberSpread(priceResult.price, 6, 4).float,
      liquidityUSD: createNumberSpread(priceResult.liquidity, 6, 2).float,
      deltaB: createNumberSpread(priceResult.deltaB, 6, 0).float
    };
    return readable;
  }

  // In practice, current implementation of getUsdPrice can only get the wsteth/eth price
  static async getUsdOracleTokenPrice(token, options = {}) {
    const block = await BlockUtil.blockFromOptions(options);
    const usdOracle = await ContractGetters.getUsdOracleContract(block.number);
    const result = await (usdOracle.__version() === 1
      ? usdOracle.callStatic.getUsdPrice(token)
      : usdOracle.callStatic.getTokenUsdPrice(token));
    // Version 1 returned a twa price, but with no lookback. Its already instantaneous but needs conversion
    const instPrice = usdOracle.__version() === 1 ? TEN_BN.pow(24).div(result) : result;

    const readable = {
      block: block.number,
      timestamp: block.timestamp,
      token,
      usdPrice: createNumberSpread(instPrice, 6, 2).float
    };
    return readable;
  }

  static #getPriceFunction(token) {
    if (token === BEAN) {
      return PriceService.getBeanPrice;
    } else if ([WETH, WSTETH].includes(token)) {
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
