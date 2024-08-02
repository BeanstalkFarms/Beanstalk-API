'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('token', 'token', 'address');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('token', 'address', 'token');
  }
};
