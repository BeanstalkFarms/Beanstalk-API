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
}

module.exports = DepositRepository;
