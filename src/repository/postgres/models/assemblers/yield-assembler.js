class YieldModelAssembler {
  static toModels(yieldResults, apyInitType, tokenModels) {
    const yieldModels = [];
    for (const window in yieldResults.ema) {
      const effectiveWindow = yieldResults.ema[window].effectiveWindow;
      for (const tokenAddr in yieldResults.yields[effectiveWindow]) {
        yieldModels.push({
          tokenId: tokenModels.find((t) => t.address.toLowerCase() === tokenAddr).id,
          season: yieldResults.season,
          emaWindow: parseInt(window),
          emaEffectiveWindow: effectiveWindow,
          emaBeans: BigInt(yieldResults.ema[window].beansPerSeason),
          initType: apyInitType,
          beanYield: yieldResults.yields[effectiveWindow][tokenAddr].bean,
          stalkYield: yieldResults.yields[effectiveWindow][tokenAddr].stalk,
          ownershipYield: yieldResults.yields[effectiveWindow][tokenAddr].ownership
        });
      }
    }
    return yieldModels;
  }

  // The model is expected to also have Token association loaded, so the token address can be used
  static fromModels(yieldModels) {
    const yieldResult = {
      season: yieldModels[0].season,
      yields: {},
      ema: {}
    };
    for (const model of yieldModels) {
      if (!yieldResult.yields[model.emaWindow]) {
        yieldResult.yields[model.emaWindow] = {};
        yieldResult.ema[model.emaWindow] = {
          effectiveWindow: model.emaEffectiveWindow,
          beansPerSeason: model.emaBeans
        };
        yieldResult.initType = model.initType;
      }
      yieldResult.yields[model.emaWindow][model.Token.address] = {
        bean: model.beanYield,
        stalk: model.stalkYield,
        ownership: model.ownershipYield
      };
    }
    return yieldResult;
  }
}

module.exports = YieldModelAssembler;
