const { ApyInitType } = require('../models/types');

const DEFAULT_OPTIONS = {
  emaWindow: 720,
  initType: ApyInitType.AVERAGE
};

class YieldRepository {
  // Returns the latest available yield entries
  static async findLatestYields(options) {
    options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Returns the yields for the requested season
  static async findSeasonYields(season, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Returns yields within the requested season range
  static async findHistoricalYields(fromSeason, toSeason, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Inserts the given yield entries
  static async addYields(yields, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
  }
}

module.exports = YieldRepository;
