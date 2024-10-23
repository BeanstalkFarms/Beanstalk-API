'use strict';

const { timestamps, bigintNumericColumn } = require('../util/sequelize-util');

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
        tokenId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'token',
            key: 'id'
          },
          onDelete: 'RESTRICT',
          allowNull: false
        },
        ...bigintNumericColumn('stem', Sequelize, { allowNull: false }),
        ...bigintNumericColumn('depositedAmount', Sequelize, { allowNull: false }),
        // Current recorded deposited bdv
        ...bigintNumericColumn('depositedBdv', Sequelize, { allowNull: false }),
        // Current stalk credited to this deposit (base + grown)
        ...bigintNumericColumn('currentStalk', Sequelize, { allowNull: false }),
        // Base stalk
        ...bigintNumericColumn('baseStalk', Sequelize, { allowNull: false }),
        // Grown stalk that has been mown
        ...bigintNumericColumn('grownStalk', Sequelize, { allowNull: false }),
        // Stem of the previous mow for this deposit
        ...bigintNumericColumn('mowStem', Sequelize, { allowNull: false }),
        // Unmown stalk
        ...bigintNumericColumn('mowableStalk', Sequelize, { allowNull: false }),
        // Current seeds
        ...bigintNumericColumn('currentSeeds', Sequelize, { allowNull: false }),
        // Recorded bdv upon a lambda convert
        ...bigintNumericColumn('bdvOnLambda', Sequelize, { allowNull: false }),
        // Total stalk upon lambda convert. Includes the resulting Mow
        ...bigintNumericColumn('stalkOnLambda', Sequelize, { allowNull: false }),
        // Seeds upon lambda convert
        ...bigintNumericColumn('seedsOnLambda', Sequelize, { allowNull: false }),
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
