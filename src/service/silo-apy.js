/**
 * @typedef {import('../../types/types').CalcApysOptions} CalcApysOptions
 * @typedef {import('../../types/types').CalcApysResult} CalcApysResult
 * @typedef {import('../../types/types').WindowEMAResult} WindowEMAResult
 */

const BeanstalkSubgraphRepository = require('../repository/beanstalk-subgraph');

/**
 * Calculates vAPYs.
 * @param {CalcApysOptions} options
 * @returns {Promise<CalcApysResult[]>}
 */
async function calcApy(options) {
  return null;
}

// First sunrise after replant was for season 6075
const ZERO_SEASON = 6074;
// First sunrise after BIP-45 Seed Gauge was deployed. This is when the APY formula changes
const GAUGE_SEASON = 21798;

/**
 * Calculates the beans per season EMA for the requested season and windows
 * @param {number} beanstalk - which Beanstalk to use
 * @param {number} season - the season for which to calculate the EMA
 * @param {number[]} windows - the lookback windows to use
 * @returns {WindowEMAResult[]}
 */
async function calcWindowEMA(beanstalk, season, windows) {

  if (season <= ZERO_SEASON) {
    throw new Error(`Invalid season requested for EMA. Minimum allowed season is ${ZERO_SEASON}.`);
  }

  if (Math.min(...windows) <= 0) {
    throw new Error(`Positive lookback window is required.`);
  }

  // Determine effective windows based on how many datapoints are actually available
  const effectiveWindows = [];
  for (const requestedWindow of windows) {
    // Currently no datapoints are available for season < ZERO_SEASON,
    // eventually that subtraction will be removed.
    effectiveWindows.push(Math.min(season - ZERO_SEASON, requestedWindow));
  }

  // Get all results from the subgraph
  const maxWindow = Math.max(...effectiveWindows);
  const mints = await BeanstalkSubgraphRepository.getSiloHourlyRewardMints(beanstalk, season - maxWindow, season);

  // Compute the EMA for each window
  const windowResults = [];
  for (const effectiveWindow of effectiveWindows) {

    const beta = 2 / (effectiveWindow + 1);

    let currentEMA = 0;
    let priorEMA = 0;

    for (let i = season - effectiveWindow + 1; i <= season; ++i) {
      currentEMA = (mints[i] - priorEMA) * beta + priorEMA;
      priorEMA = currentEMA;
    }

    windowResults.push({
      window: effectiveWindow,
      beansPerSeason: Math.round(currentEMA)
    });
  }
  return windowResults;
}

module.exports = {
  calcApy,
  calcWindowEMA
};