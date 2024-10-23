'use strict';

const { timestamps } = require('../util/sequelize-util');

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
        stem: {
          type: Sequelize.NUMERIC(38, 0),
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
        depositedAmount: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
        // Current recorded deposited bdv
        depositedBdv: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
        // Current stalk credited to this deposit (base + grown)
        currentStalk: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
        // Base stalk
        baseStalk: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
        // Grown stalk that has been mown
        grownStalk: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
        // Stem of the previous mow for this deposit
        mowStem: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
        // Unmown stalk
        mowableStalk: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
        // Current seeds
        currentSeeds: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
        // Recorded bdv upon a lambda convert
        bdvOnLambda: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
        // Total stalk upon lambda convert. Includes the resulting Mow
        stalkOnLambda: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
        // Seeds upon lambda convert
        seedsOnLambda: {
          type: Sequelize.NUMERIC(38, 0),
          allowNull: false
        },
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
