'use strict';

const { timestamps, bigintStringColumn } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'deposit',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        chain: {
          type: Sequelize.STRING,
          allowNull: false
        },
        account: {
          type: Sequelize.STRING,
          allowNull: false
        },
        ...bigintStringColumn('stem', Sequelize, { allowNull: false }),
        tokenId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'token',
            key: 'id'
          },
          onDelete: 'RESTRICT',
          allowNull: false
        },
        ...bigintStringColumn('depositedAmount', Sequelize, { allowNull: false }),
        // Current recorded deposited bdv
        ...bigintStringColumn('depositedBdv', Sequelize, { allowNull: false }),
        // Current stalk credited to this deposit (base + grown)
        ...bigintStringColumn('currentStalk', Sequelize, { allowNull: false }),
        // Base stalk
        ...bigintStringColumn('baseStalk', Sequelize, { allowNull: false }),
        // Grown stalk that has been mown
        ...bigintStringColumn('grownStalk', Sequelize, { allowNull: false }),
        // Stem of the previous mow for this deposit
        ...bigintStringColumn('mowStem', Sequelize, { allowNull: false }),
        // Unmown stalk
        ...bigintStringColumn('mowableStalk', Sequelize, { allowNull: false }),
        // Current seeds
        ...bigintStringColumn('currentSeeds', Sequelize, { allowNull: false }),
        // Recorded bdv upon a lambda convert
        ...bigintStringColumn('bdvOnLambda', Sequelize, { allowNull: false }),
        // Total stalk upon lambda convert. Includes the resulting Mow
        ...bigintStringColumn('stalkOnLambda', Sequelize, { allowNull: false }),
        // Seeds upon lambda convert
        ...bigintStringColumn('seedsOnLambda', Sequelize, { allowNull: false }),
        ...timestamps(Sequelize)
      },
      {
        uniqueKeys: {
          depositEntry: {
            fields: ['chain', 'account', 'tokenId', 'stem']
          }
        }
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('deposit');
  }
};
