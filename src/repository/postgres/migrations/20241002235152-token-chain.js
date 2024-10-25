'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('token', 'chain', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'eth'
    });

    await queryInterface.addColumn('token', 'supply', {
      type: Sequelize.NUMERIC(38, 0),
      allowNull: false,
      defaultValue: '0'
    });

    // Remove the default values so future inserts don't automatically use it
    await queryInterface.changeColumn('token', 'chain', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn('token', 'supply', {
      type: Sequelize.NUMERIC(38, 0),
      allowNull: false
    });

    // Update unique index to be on (chain, supply)
    await queryInterface.removeConstraint('token', 'token_token_key');
    await queryInterface.addConstraint('token', {
      fields: ['address', 'chain'],
      type: 'unique',
      name: 'token_address_chain_ukey'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('token', 'token_address_chain_ukey');
    await queryInterface.addConstraint('token', {
      fields: ['address'],
      type: 'unique',
      name: 'token_token_key'
    });

    await queryInterface.removeColumn('token', 'chain');
    await queryInterface.removeColumn('token', 'supply');
  }
};
