const NumberUtil = require('../../utils/number');

class WellDto {
  static subgraphFields = `
    id
    tokens {
      id
      decimals
    }
    tokenOrder
    reserves
    symbol
    tokenPrice
    rollingDailyBiTradeVolumeReserves
    wellFunction {
      id
    }
    wellFunctionData
  `;

  constructor(subgraphWell) {
    this.address = subgraphWell.id;
    this.symbol = subgraphWell.symbol;
    this.tokens = this.#orderedTokens(subgraphWell.tokens, subgraphWell.tokenOrder);
    this.rates = NumberUtil.createNumberSpread(subgraphWell.tokenPrice.map(BigInt), this.tokenDecimals());
    this.reserves = NumberUtil.createNumberSpread(subgraphWell.reserves.map(BigInt), this.tokenDecimals());
    this.biTokenVolume24h = NumberUtil.createNumberSpread(
      subgraphWell.rollingDailyBiTradeVolumeReserves.map(BigInt),
      this.tokenDecimals()
    );
    this.wellFunction = {
      id: subgraphWell.wellFunction.id,
      data: subgraphWell.wellFunctionData
    };
  }

  tokenDecimals() {
    return this.tokens.map((t) => t.decimals);
  }

  // Orders the tokens with the provided order.
  #orderedTokens(tokens, tokenOrder) {
    if (!tokens || !tokenOrder || !tokens[0].id) {
      throw new Error(`Can't order tokens with the provided fields.`);
    }
    const tokenOrderMap = tokenOrder.reduce((a, next, idx) => {
      a[next] = idx;
      return a;
    }, {});
    tokens.sort((a, b) => tokenOrderMap[a.id] - tokenOrderMap[b.id]);
    return tokens.map((t) => ({
      address: t.id,
      decimals: t.decimals
    }));
  }
}

module.exports = WellDto;
