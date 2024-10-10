// NOTE:
// Gauge Points are computed with 0 decimals instead of 18 (i.e. 1000e18 is max GP, here its 1000)
// Percentages are also computed with 0 instead of 6 (i.e. 100e6 is max percent, here it is 100)

const EXTREME_FAR_POINT = 5;
const RELATIVE_FAR_POINT = 3;
const RELATIVE_CLOSE_POINT = 1;

const MAX_GAUGE_POINTS = 1000;
const MAX_PERCENT = 100;

const UPPER_THRESHOLD = 10050;
const LOWER_THRESHOLD = 9950;
const THRESHOLD_PRECISION = 10000;
const EXCESSIVELY_FAR = 66.666666;
const RELATIVELY_FAR = 33.333333;
const PERCENT_PRECISION = 100;

class DefaultGaugePointFunction {
  // See {GaugePointFacet.defaultGaugePointFunction} for contract implementation.
  static next(currentGaugePoints, optimalPercentDepositedBdv, percentOfDepositedBdv) {
    if (percentOfDepositedBdv > (optimalPercentDepositedBdv * UPPER_THRESHOLD) / THRESHOLD_PRECISION) {
      // Cap gauge points to MAX_PERCENT if it exceeds.
      if (percentOfDepositedBdv > MAX_PERCENT) {
        percentOfDepositedBdv = MAX_PERCENT;
      }
      const deltaPoints = DefaultGaugePointFunction._getDeltaPoints(
        optimalPercentDepositedBdv,
        percentOfDepositedBdv,
        true
      );
      // gauge points cannot go below 0.
      if (deltaPoints < currentGaugePoints) {
        return currentGaugePoints - deltaPoints;
      } else {
        // Cap gaugePoints to 0 if it exceeds.
        return 0;
      }
    } else if (percentOfDepositedBdv < (optimalPercentDepositedBdv * LOWER_THRESHOLD) / THRESHOLD_PRECISION) {
      const deltaPoints = DefaultGaugePointFunction._getDeltaPoints(
        optimalPercentDepositedBdv,
        percentOfDepositedBdv,
        false
      );

      // gauge points cannot go above MAX_GAUGE_POINTS.
      if (deltaPoints + currentGaugePoints < MAX_GAUGE_POINTS) {
        return currentGaugePoints + deltaPoints;
      } else {
        // Cap gaugePoints to MAX_GAUGE_POINTS if it exceeds.
        return MAX_GAUGE_POINTS;
      }
    } else {
      // If % of deposited BDV is .5% within range of optimal,
      // keep gauge points the same.
      return currentGaugePoints;
    }
  }

  static _getDeltaPoints(optimalPercentBdv, percentBdv, isAboveOptimal) {
    if (isAboveOptimal) {
      const exsFar = DefaultGaugePointFunction._getExtremelyFarAbove(optimalPercentBdv);
      const relFar = DefaultGaugePointFunction._getRelativelyFarAbove(optimalPercentBdv);

      if (percentBdv > exsFar) {
        return EXTREME_FAR_POINT;
      } else if (percentBdv > relFar) {
        return RELATIVE_FAR_POINT;
      } else {
        return RELATIVE_CLOSE_POINT;
      }
    } else {
      const exsFar = DefaultGaugePointFunction._getExtremelyFarBelow(optimalPercentBdv);
      const relFar = DefaultGaugePointFunction._getRelativelyFarBelow(optimalPercentBdv);

      if (percentBdv < exsFar) {
        return EXTREME_FAR_POINT;
      } else if (percentBdv < relFar) {
        return RELATIVE_FAR_POINT;
      } else {
        return RELATIVE_CLOSE_POINT;
      }
    }
  }

  static _getExtremelyFarAbove(optimalPercentBdv) {
    return ((MAX_PERCENT - optimalPercentBdv) * EXCESSIVELY_FAR) / PERCENT_PRECISION + optimalPercentBdv;
  }

  static _getRelativelyFarAbove(optimalPercentBdv) {
    return ((MAX_PERCENT - optimalPercentBdv) * RELATIVELY_FAR) / PERCENT_PRECISION + optimalPercentBdv;
  }

  static _getExtremelyFarBelow(optimalPercentBdv) {
    return (optimalPercentBdv * (PERCENT_PRECISION - EXCESSIVELY_FAR)) / PERCENT_PRECISION;
  }

  static _getRelativelyFarBelow(optimalPercentBdv) {
    return (optimalPercentBdv * (PERCENT_PRECISION - RELATIVELY_FAR)) / PERCENT_PRECISION;
  }
}

module.exports = DefaultGaugePointFunction;
