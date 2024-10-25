const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');

class TokenRepository {
  // Returns all whitelisted tokens
  static async findWhitelistedTokens(chain) {
    const optionalWhere = {};
    if (chain) {
      optionalWhere.chain = chain;
    }

    const models = await sequelize.models.Token.findAll({
      where: {
        isWhitelisted: true,
        ...optionalWhere
      },
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return models;
  }

  // Returns all tokens matching the requested addresses
  static async findByAddresses(addresses) {
    const models = await sequelize.models.Token.findAll({
      where: {
        address: {
          [Sequelize.Op.in]: addresses
        }
      },
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return models;
  }

  // Updates the given token with new column values
  static async updateToken(address, chain, fieldsToUpdate) {
    const [_, updatedTokens] = await sequelize.models.Token.update(fieldsToUpdate, {
      where: {
        address,
        chain
      },
      transaction: AsyncContext.getOrUndef('transaction'),
      returning: true
    });
    return updatedTokens;
  }
}

module.exports = TokenRepository;
