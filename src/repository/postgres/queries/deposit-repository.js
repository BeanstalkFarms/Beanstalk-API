const InputError = require('../../../error/input-error');
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
  static async findAllWithOptions({
    criteriaList = null,
    lambdaBdvChange = null,
    sort = null,
    limit = null,
    skip = null
  } = {}) {
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
    options.where = this._constructFindWhere(criteriaList, lambdaBdvChange);
    if (sort) {
      options.order = this._constructFindSort(sort);
    }
    options.limit = limit ?? 100;
    if (skip) {
      options.offset = skip;
    }

    const deposits = await sequelize.models.Deposit.findAll(options);
    return deposits;
  }

  // Inserts/Updates the given deposit rows
  static async upsertDeposits(deposits) {
    const TAG = Concurrent.tag('upsertDeposits');
    for (const row of deposits) {
      await Concurrent.run(TAG, 50, async () => {
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

  static _constructFindWhere(criteriaList, lambdaBdvChange) {
    const conditions = [];

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

      conditions.push({
        [Sequelize.Op.or]: rowCriteria
      });
    }

    if (lambdaBdvChange) {
      const cmp = lambdaBdvChange === 'increase' ? '>' : '<';
      conditions.push(Sequelize.literal(`"bdvOnLambda" - "depositedBdv" ${cmp} 0`));
    }

    return conditions.length > 0 ? { [Sequelize.Op.and]: conditions } : {};
  }

  static _constructFindSort(sort) {
    const SORT_OPTONS = {
      'bdv|absolute': 'ABS("bdvOnLambda" - "depositedBdv")',
      'bdv|relative': 'ABS("bdvOnLambda" - "depositedBdv") / "depositedBdv"',
      'stalk|absolute': 'ABS("stalkOnLambda" - "currentStalk")',
      'stalk|relative': 'ABS("stalkOnLambda" - "currentStalk") / "currentStalk"',
      'seeds|absolute': 'ABS("seedsOnLambda" - "currentSeeds")',
      'seeds|relative': 'ABS("seedsOnLambda" - "currentSeeds") / "currentSeeds"'
    };
    const sqlLiteral = SORT_OPTONS[`${sort.field}|${sort.type}`];
    if (!sqlLiteral) {
      throw new InputError('Invalid sort options provided');
    }

    return [[Sequelize.literal(sqlLiteral), 'DESC']];
  }
}

module.exports = DepositRepository;
