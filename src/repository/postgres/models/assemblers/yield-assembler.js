const { C } = require('../../../../constants/runtime-constants');

class YieldModelAssembler {
  static toModels(yieldResults, requestedWindows, apyInitType, tokenModels) {
    const yieldModels = [];
    const availableWindows = Object.keys(yieldResults.yields).map((w) => parseInt(w));
    const maxAvailable = Math.max(...availableWindows);
    for (const window of requestedWindows) {
      const effectiveWindow = window > maxAvailable ? maxAvailable : window;
      for (const tokenAddr in yieldResults.yields[effectiveWindow]) {
        yieldModels.push({
          tokenId: tokenModels.find((t) => t.address.toLowerCase() === tokenAddr).id,
          season: yieldResults.season,
          emaWindow: window,
          emaEffectiveWindow: effectiveWindow,
          emaBeans: BigInt(yieldResults.ema[window].rewardBeans),
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
          rewardBeans: model.emaBeans
        };
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
