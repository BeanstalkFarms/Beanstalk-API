const { sequelize, Sequelize } = require('../models');

const DEFAULT_OPTIONS = {};

class DepositRepository {
  static async numRows(options) {
    options = { ...DEFAULT_OPTIONS, ...options };

    const count = await sequelize.models.Deposit.count({
      transaction: options.transaction
    });
    return count;
  }

  // Inserts/Updates the given deposit rows
  static async upsertDeposits(deposits, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    for (const row of deposits) {
      await sequelize.models.Deposit.upsert(row, {
        validate: true,
        transaction: options.transaction
      });
    }
  }
}

module.exports = DepositRepository;
