// NOTE:
// Gauge Points are computed with 0 decimals instead of 18 (i.e. 1000e18 is max GP, here its 1000)
// Percentages are also computed with 0 instead of 6 (i.e. 100e6 is max percent, here it is 100)

const DEFAULT_MAX_GAUGE_POINTS = 1000;
const DEFAULT_UPPER_THRESHOLD = 10001;
const DEFAULT_LOWER_THRESHOLD = 9999;
const DEFAULT_THRESHOLD_PRECISION = 10000;

class LegacyDefaultGaugePointFunction {
  // See {GaugePointFacet.defaultGaugePointFunction} for contract implementation.
  static next(currentGaugePoints, optimalPercentDepositedBdv, percentOfDepositedBdv) {
    if (percentOfDepositedBdv > (optimalPercentDepositedBdv * DEFAULT_UPPER_THRESHOLD) / DEFAULT_THRESHOLD_PRECISION) {
      if (currentGaugePoints <= 1) {
        // Gauge points cannot go below 0.
        return 0;
      }
      return currentGaugePoints - 1;
    } else if (
      percentOfDepositedBdv <
      (optimalPercentDepositedBdv * DEFAULT_LOWER_THRESHOLD) / DEFAULT_THRESHOLD_PRECISION
    ) {
      // Cap gaugePoints to MAX_GAUGE_POINTS if it exceeds.
      if (currentGaugePoints + 1 > DEFAULT_MAX_GAUGE_POINTS) {
        return DEFAULT_MAX_GAUGE_POINTS;
      } else {
        return currentGaugePoints + 1;
      }
    } else {
      // If % of deposited BDV is .01% within range of optimal,
      // keep gauge points the same.
      return currentGaugePoints;
    }
  }
}

module.exports = LegacyDefaultGaugePointFunction;
