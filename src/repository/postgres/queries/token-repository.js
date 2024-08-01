const { sequelize, Sequelize } = require('../models');

class TokenRepository {
  // Returns all whitelisted tokens
  static async findWhitelistedTokens(options) {
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
    await sequelize.models.Token.update(fieldsToUpdate, {
      where: {
        token
      },
      transaction: options.transaction
    });
  }
}

module.exports = TokenRepository;
