const Contracts = require('../datasources/contracts/contracts');
const BlockUtil = require('../utils/block');
const { createNumberSpread } = require('../utils/number');
const { BEAN, WETH } = require('../constants/addresses');
const { TEN_BN } = require('../constants/constants');

class PriceService {
  // Gets the price of the requested token
  static async getTokenPrice(token, options = {}) {
    const priceFunction = PriceService.#getPriceFunction(token);
    return await priceFunction.call(null, options);
  }

  // Gets the price of bean as returned by the canonical price contract.
  static async getBeanPrice(options = {}) {
    const block = await BlockUtil.blockFromOptions(options);
    const priceContract = await Contracts.asyncPriceV1ContractGetter();
    const priceResult = await priceContract.callStatic.price({ blockTag: block.number });

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

  // In practice, current implementation of getUsdPrice can only get the eth price
  static async getEthPrice(options = {}) {
    const block = await BlockUtil.blockFromOptions(options);
    const usdOracle = await Contracts.asyncUsdOracleContractGetter();
    const result = await usdOracle.callStatic.getUsdPrice(WETH, { blockTag: block.number });
    // getUsdPrice returns a twa price, but with no lookback. Its already instantaneous but needs conversion
    const instPrice = TEN_BN.pow(24).div(result);

    const readable = {
      block: block.number,
      timestamp: block.timestamp,
      token: WETH,
      usdPrice: createNumberSpread(instPrice, 6, 2).float
    };
    return readable;
  }

  static #getPriceFunction(token) {
    if (token === BEAN) {
      return PriceService.getBeanPrice;
    } else if (token === WETH) {
      return PriceService.getEthPrice;
    }
    return () => ({
      token: token,
      usdPrice: 0
    });
    // throw new Error('Price not implemented for the requested token.');
  }
}

module.exports = PriceService;
