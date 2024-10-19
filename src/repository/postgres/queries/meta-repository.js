const AsyncContext = require('../../../utils/async/context');
const { sequelize, Sequelize } = require('../models');

class MetaRepository {
  static async get(chain) {
    const meta = await sequelize.models.Meta.findOne({
      where: {
        chain
      },
      transaction: AsyncContext.getOrUndef('transaction')
    });
    return meta;
  }

  static async update(chain, fieldsToUpdate) {
    await sequelize.models.Meta.update(fieldsToUpdate, {
      where: {
        chain
      },
      transaction: AsyncContext.getOrUndef('transaction')
    });
  }

  static async insert(meta) {
    await sequelize.models.Meta.create(meta, {
      validate: true,
      transaction: AsyncContext.getOrUndef('transaction')
    });
  }
}

module.exports = MetaRepository;
