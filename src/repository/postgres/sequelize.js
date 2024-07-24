const { Sequelize } = require('sequelize');
const { TestModelConfig } = require('./models/test-model');

// Configure database connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  // When running the API in docker: the host needs to be the docker service name
  host: process.env.DB_HOST,
  dialect: 'postgres'
});

// Define models
const TestModel = sequelize.define(TestModelConfig.name, TestModelConfig.attributes, TestModelConfig.options);

module.exports = {
  sequelize,
  TestModel
};
