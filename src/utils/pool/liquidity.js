const PriceService = require('../../service/price-service');
const { createNumberSpread } = require('../number');

class LiquidityUtil {
  // Calculates the current usd liquidity for a pool having these tokens and reserves
  static async calcPoolLiquidityUSD(tokens, reserves, blockNumber) {
    let totalLiquidity = 0;
    for (let i = 0; i < tokens.length; ++i) {
      const tokenPrice = await PriceService.getTokenPrice(tokens[i].id, { blockNumber });
      const tokenCount = createNumberSpread(reserves[i], tokens[i].decimals);
      totalLiquidity += tokenPrice.usdPrice * tokenCount.float;
    }
    return totalLiquidity;
  }
}

module.exports = LiquidityUtil;
