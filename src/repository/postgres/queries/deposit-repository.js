const Concurrent = require('../../../utils/async/concurrent');
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
      include: [
        {
          model: sequelize.models.Token,
          attributes: ['address']
        }
      ],
      where: {},
      transaction: AsyncContext.getOrUndef('transaction')
    };
    // Apply optional values when provided
    if (criteriaList && criteriaList.length > 0) {
      // Transform the input to reference the address on associated Token entity, and bigint to string
      const rowCriteria = criteriaList.map((c) =>
        Object.keys(c).reduce((acc, next) => {
          if (next === 'token') {
            acc['$Token.address$'] = c[next];
          } else if (typeof c[next] === 'bigint') {
            acc[next] = c[next].toString();
          } else {
            acc[next] = c[next];
          }
          return acc;
        }, {})
      );
      options.where = {
        [Sequelize.Op.or]: rowCriteria
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
    const TAG = 'upsertDeposits';
    for (const row of deposits) {
      await Concurrent.run(TAG, async () => {
        await sequelize.models.Deposit.upsert(row, {
          validate: true,
          transaction: AsyncContext.getOrUndef('transaction')
        });
      });
    }
    await Concurrent.allResolved(TAG);
  }

  static async destroyByIds(depositIds) {
    await sequelize.models.Deposit.destroy({
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
