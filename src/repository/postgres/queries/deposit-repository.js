const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');

class DepositRepository {
  static async numRows() {
    const count = await sequelize.models.Deposit.count({
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return count;
  }

  // Retrieves a list of deposits following optional criteria
  static async findAllWithOptions({ criteriaList = null, sort = null, limit = null, skip = null } = {}) {
    const options = {
      where: {},
      transaction: AsyncContext.getOrUndef('transaction')
    };
    // Apply optional values when provided
    if (criteriaList && criteriaList.length > 0) {
      options.where = {
        [Sequelize.Op.or]: criteriaList
      };
    }
    if (sort) {
      options.order = sort;
    }
    if (limit) {
      options.limit = limit;
    }
    if (skip) {
      options.offset = skip;
    }

    const deposits = await sequelize.models.Deposit.findAll(options);
    return deposits;
  }

  // Inserts/Updates the given deposit rows
  static async upsertDeposits(deposits) {
    for (const row of deposits) {
      await sequelize.models.Deposit.upsert(row, {
        validate: true,
        transaction: AsyncContext.getOrUndef('transaction')
      });
    }
  }

  static async destroyByIds(depositIds) {
    await sequelize.models.Deposit.detroy({
      where: {
        id: {
          [Sequelize.Op.in]: depositIds
        }
      },
      transaction: AsyncContext.getOrUndef('transaction')
    });
  }
}

module.exports = DepositRepository;
