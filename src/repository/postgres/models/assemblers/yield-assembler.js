const { BEANSTALK } = require('../../../../constants/addresses');

class YieldModelAssembler {
  static toModels(yieldResults, apyInitType, tokenModels) {
    const yieldModels = [];
    for (const window in yieldResults.yields) {
      for (const tokenAddr in yieldResults.yields[window]) {
        yieldModels.push({
          tokenId: tokenModels.find((t) => t.token.toLowerCase() === tokenAddr).id,
          season: yieldResults.season,
          emaWindow: parseInt(window),
          emaBeans: BigInt(yieldResults.emaBeans[window]),
          initType: apyInitType,
          beanYield: yieldResults.yields[window][tokenAddr].bean,
          stalkYield: yieldResults.yields[window][tokenAddr].stalk,
          ownershipYield: yieldResults.yields[window][tokenAddr].ownership
        });
      }
    }
    return yieldModels;
  }

  // The model is expected to also have Token association loaded, so the token address can be used
  static fromModels(yieldModels) {
    const yieldResult = {
      beanstalk: BEANSTALK,
      season: yieldModels[0].season,
      yields: {},
      emaBeans: {}
    };
    for (const model of yieldModels) {
      if (!yieldResult.yields[model.emaWindow]) {
        yieldResult.yields[model.emaWindow] = {};
        yieldResult.emaBeans[model.emaWindow] = model.emaBeans;
      }
      yieldResult.yields[model.emaWindow][model.Token.token] = {
        bean: model.beanYield,
        stalk: model.stalkYield,
        ownership: model.ownershipYield
      };
    }
    return yieldResult;
  }
}

module.exports = YieldModelAssembler;
