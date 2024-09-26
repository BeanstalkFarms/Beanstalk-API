class WellDto {
  constructor(subgraphWell) {
    this.address = subgraphWell.id;
    this.symbol = subgraphWell.symbol;
    this.tokens = this.orderedTokens(subgraphWell.tokens, subgraphWell.tokenOrder);
    this.reserves = subgraphWell.reserves.map(BigInt);
    this.rollingDailyBiTradeVolumeReserves = subgraphWell.rollingDailyBiTradeVolumeReserves.map(BigInt);
  }

  // Orders the tokens with the provided order.
  orderedTokens(tokens, tokenOrder) {
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
