const { sequelize, Sequelize } = require('../models');

const DEFAULT_OPTIONS = {};

class TokenRepository {
  // Returns all whitelisted tokens
  static async findWhitelistedTokens(options) {
    options = { ...DEFAULT_OPTIONS, ...options };

    const optionalWhere = {};
    if (options.chain) {
      optionalWhere.chain = options.chain;
    }

    const rows = await sequelize.models.Token.findAll({
      where: {
        isWhitelisted: true,
        ...optionalWhere
      },
      transaction: options.transaction
    });
    return rows;
  }

  // Updates the given token with new column values
  static async updateToken(address, chain, fieldsToUpdate, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    const [_, updatedTokens] = await sequelize.models.Token.update(fieldsToUpdate, {
      where: {
        address,
        chain
      },
      transaction: options.transaction,
      returning: true
    });
    return updatedTokens;
  }
}

module.exports = TokenRepository;
