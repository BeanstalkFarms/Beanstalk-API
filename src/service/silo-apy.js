/**
 * @typedef {import('../../types/types').CalcApysOptions} CalcApysOptions
 * @typedef {import('../../types/types').CalcApysResult} CalcApysResult
 * @typedef {import('../../types/types').WindowEMAResult} WindowEMAResult
 */

const BeanstalkSubgraphRepository = require('../repository/beanstalk-subgraph');
const { calcApyPreGauge } = require('../utils/apy/pre-gauge');
const { providerThenable } = require('../datasources/alchemy');

const ContractStorage = require("@beanstalk/contract-storage/src/contract-storage");
const StorageBIP47 = require('../datasources/storage/beanstalk/StorageBIP47.json');
const { BEAN } = require('../constants/addresses');

// First sunrise after replant was for season 6075
const ZERO_SEASON = 6074;
// First sunrise after BIP-45 Seed Gauge was deployed. This is when the APY formula changes
const GAUGE_SEASON = 21798;

class SiloApyService {

  /**
   * Calculates vAPYs.
   * @param {CalcApysOptions} options
   * @returns {Promise<CalcApysResult[]>}
   */
  static async calcApy(options) {
    
    const windowEMAs = await SiloApyService.calcWindowEMA(options.beanstalk, options.season, options.windows);

    // To get results onchain, need to be able to determine which block to use given a season number.
    // Otherwise the subgraph should be usable for the necessary data.
    
    if (options.season < GAUGE_SEASON) {
      
      const inputs = await BeanstalkSubgraphRepository.getPreGaugeApyInputs(options.beanstalk, options.season);
      console.log(inputs);

      for (const ema of windowEMAs) {
        calcApyPreGauge({
          beansPerSeason: ema.beansPerSeason,
          tokens: options.tokens,
          seedsPerTokenBdv: options.tokens.map(t => inputs.tokens[t].grownStalkPerSeason),
          seedsPerBeanBdv: inputs.tokens[BEAN].grownStalkPerSeason,
          totalStalk: inputs.silo.stalk,
          totalSeeds: inputs.silo.seeds
        });
      }
    } else {
      // const bs = new ContractStorage(await providerThenable, BEANSTALK, StorageBIP47);
    }
  }

  /**
   * Calculates the beans per season EMA for the requested season and windows
   * @param {number} beanstalk - which Beanstalk to use
   * @param {number} season - the season for which to calculate the EMA
   * @param {number[]} windows - the lookback windows to use
   * @returns {WindowEMAResult[]}
   */
  static async calcWindowEMA(beanstalk, season, windows) {

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
        currentEMA = (Number(mints[i]) - priorEMA) * beta + priorEMA;
        priorEMA = currentEMA;
      }

      windowResults.push({
        window: effectiveWindow,
        beansPerSeason: BigInt(Math.round(currentEMA))
      });
    }
    return windowResults;
  }
}

module.exports = SiloApyService;
