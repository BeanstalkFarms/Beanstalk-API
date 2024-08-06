const { sequelize, Sequelize } = require('../models');
const { ApyInitType } = require('../models/types/types');

const DEFAULT_OPTIONS = {
  emaWindows: [24, 168, 720],
  initType: ApyInitType.AVERAGE
};

class YieldRepository {
  // Returns the latest available yield entries
  static async findLatestYields(options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    throw new Error('Not Implemented');
  }

  // Returns the yields for the requested season
  static async findSeasonYields(season, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    const rows = await sequelize.models.Yield.findAll({
      include: [
        {
          model: sequelize.models.Token,
          attributes: ['address']
        }
      ],
      where: {
        season: {
          [Sequelize.Op.eq]: season
        },
        emaWindow: {
          [Sequelize.Op.in]: options.emaWindows
        },
        initType: {
          [Sequelize.Op.eq]: options.initType
        }
      },
      transaction: options.transaction
    });
    return rows;
  }

  // Returns yields within the requested season range
  static async findHistoricalYields(fromSeason, toSeason, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    throw new Error('Not Implemented');
  }

  // Inserts the given yield entries
  static async addYields(yields, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    const newYields = await sequelize.models.Yield.bulkCreate(yields, {
      validate: true,
      returning: true,
      transaction: options.transaction
    });
    return newYields;
  }
}

module.exports = YieldRepository;
