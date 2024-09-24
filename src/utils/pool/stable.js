class StableWellUtil {
  // Given the reserves, returns the current price of each token
  // The prices returned are in terms of the other token
  static calcPrice(reserves, decimals) {}

  // Calculates the requested percent depth from the reserves in the pool.
  static calcDepth(reserves, decimals, percent = 2) {}

  static calcMissingReserve(originalReserves, knownReserve) {}
}

module.exports = StableWellUtil;
