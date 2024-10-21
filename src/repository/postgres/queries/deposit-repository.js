const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');

class DepositRepository {
  static async numRows() {
    const count = await sequelize.models.Deposit.count({
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return count;
  }

  // Retrieves a list of deposits matching a set of criteria
  static async findByCriteria(criteriaList) {
    const deposits = await sequelize.models.Deposit.findAll({
      where: {
        [Sequelize.Op.or]: criteriaList
      },
      transaction: AsyncContext.getOrUndef('transaction')
    });
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
}

module.exports = DepositRepository;
