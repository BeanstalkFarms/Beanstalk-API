const { sequelize, Sequelize } = require('../models');

const DEFAULT_OPTIONS = {};

class MetaRepository {
  static async get(chain, options) {
    options = { ...DEFAULT_OPTIONS, ...options };

    const meta = await sequelize.models.Meta.findOne({
      where: {
        chain
      },
      transaction: options.transaction
    });
    return meta;
  }

  static async update(chain, fieldsToUpdate, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    await sequelize.models.Meta.update(fieldsToUpdate, {
      where: {
        chain
      },
      transaction: options.transaction
    });
  }

  static async insert(meta, options) {
    options = { ...DEFAULT_OPTIONS, ...options };
    await sequelize.models.Meta.create(meta, {
      validate: true,
      transaction: options.transaction
    });
  }
}

module.exports = MetaRepository;
