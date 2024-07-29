'use strict';

const { timestamps } = require('../util/sequelize-util');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      symbol: {
        type: Sequelize.STRING,
        allowNull: false
      },
      decimals: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      isWhitelisted: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      bdv: {
        type: Sequelize.STRING
      },
      stalkEarnedPerSeason: {
        type: Sequelize.STRING
      },
      stemTip: {
        type: Sequelize.STRING
      },
      totalDeposited: {
        type: Sequelize.STRING
      },
      totalDepositedBdv: {
        type: Sequelize.STRING
      },
      ...timestamps(Sequelize)
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('token');
  }
};
