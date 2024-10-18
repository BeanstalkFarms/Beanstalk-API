const { sequelize, Sequelize } = require('../models');
const DepositModelAssembler = require('../models/assemblers/deposit-assembler');

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
    await sequelize.models.Deposit.upsert(deposits, {
      validate: true,
      transaction: options.transaction
    });
  }
}

module.exports = DepositRepository;
