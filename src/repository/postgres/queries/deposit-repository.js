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

  // Inserts the given deposit rows
  static async addDeposits(deposits, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    const newDeposits = await sequelize.models.Deposit.bulkCreate(deposits, {
      validate: true,
      returning: true,
      transaction: options.transaction
    });
    return newDeposits;
  }
}

module.exports = DepositRepository;
