const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');
const { ApyInitType } = require('../models/types/types');

const DEFAULT_OPTIONS = {
  emaWindows: [24, 168, 720],
  initType: ApyInitType.AVERAGE
};

class YieldRepository {
  // Returns the yields for the requested season
  static async findSeasonYields(season, options) {
    options = { ...DEFAULT_OPTIONS, ...options };

    const optionalWhere = {};
    if (options.where.emaWindows) {
      optionalWhere.emaWindow = {
        [Sequelize.Op.in]: options.where.emaWindows
      };
    }
    if (options.where.initType) {
      optionalWhere.initType = options.where.initType;
    }

    const rows = await sequelize.models.Yield.findAll({
      include: [
        {
          model: sequelize.models.Token,
          attributes: ['address']
        }
      ],
      where: {
        season,
        ...optionalWhere
      },
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return rows;
  }

  // Returns yields within the requested season range
  static async findHistoricalYields(fromSeason, toSeason, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    throw new Error('Not Implemented');
  }

  // Inserts the given yield entries
  static async addYields(yields) {
    const newYields = await sequelize.models.Yield.bulkCreate(yields, {
      validate: true,
      returning: true,
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return newYields;
  }

  // Returns a list of all seasons that are missing yield entries
  static async findMissingSeasons(maxSeason) {
    const seasons = await sequelize.query(
      `
        SELECT s AS missingseason
        FROM generate_series(1, :maxSeason) AS s
        LEFT JOIN (SELECT DISTINCT season FROM yield) y ON s = y.season
        WHERE y.season IS NULL;
      `,
      {
        replacements: { maxSeason },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    return seasons.map((s) => s.missingseason);
  }
}

module.exports = YieldRepository;
