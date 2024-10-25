const { C } = require('../../../../constants/runtime-constants');
const DefaultGaugePointFunction = require('./default');
const LegacyDefaultGaugePointFunction = require('./legacy');

class GPFunction {
  static forSeason(season, currentGaugePoints, optimalPercentDepositedBdv, percentOfDepositedBdv) {
    if (season < C('arb').MILESTONE.startSeason) {
      return LegacyDefaultGaugePointFunction.next(
        currentGaugePoints,
        optimalPercentDepositedBdv,
        percentOfDepositedBdv
      );
    } else {
      return DefaultGaugePointFunction.next(currentGaugePoints, optimalPercentDepositedBdv, percentOfDepositedBdv);
    }
  }
}

module.exports = GPFunction;
