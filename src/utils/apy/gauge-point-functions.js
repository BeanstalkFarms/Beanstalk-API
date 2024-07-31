class GaugePointFunctions {
  // See {GaugePointFacet.defaultGaugePointFunction} for contract implementation.
  static defaultGaugePointFunction(currentGaugePoints, optimalPercentDepositedBdv, percentOfDepositedBdv) {
    return currentGaugePoints;
  }
}

module.exports = GaugePointFunctions;
