const { sequelize, Sequelize } = require('../models');

const DEFAULT_OPTIONS = {};

class TokenRepository {
  // Returns all whitelisted tokens
  static async findWhitelistedTokens(options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    const rows = await sequelize.models.Token.findAll({
      where: {
        isWhitelisted: {
          [Sequelize.Op.eq]: true
        }
      },
      transaction: options.transaction
    });
    return rows;
  }

  // Updates the given token with new column values
  static async updateToken(token, fieldsToUpdate, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    const [_, updatedTokens] = await sequelize.models.Token.update(fieldsToUpdate, {
      where: {
        token
      },
      transaction: options.transaction,
      returning: true
    });
    return updatedTokens;
  }
}

module.exports = TokenRepository;
