'use strict';

const { ApyInitType } = require('../models/types/types');
const { bigintStringColumn, timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'yield',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
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
        season: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        emaWindow: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        ...bigintStringColumn('emaBeans', Sequelize, { allowNull: false }),
        initType: {
          type: Sequelize.ENUM,
          values: Object.values(ApyInitType),
          allowNull: false
        },
        beanYield: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        stalkYield: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        ownershipYield: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        ...timestamps(Sequelize)
      },
      {
        uniqueKeys: {
          seasonEntry: {
            fields: ['tokenId', 'season', 'emaWindow', 'initType']
          }
        }
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('yield');
  }
};
