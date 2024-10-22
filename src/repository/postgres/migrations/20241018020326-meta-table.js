'use strict';

const { timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'ApiMeta',
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
        lastDepositUpdate: {
          type: Sequelize.INTEGER
        },
        lastLambdaBdvs: {
          type: Sequelize.TEXT
        },
        ...timestamps(Sequelize)
      },
      {
        uniqueKeys: {
          chain: {
            fields: ['chain']
          }
        }
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ApiMeta');
  }
};
