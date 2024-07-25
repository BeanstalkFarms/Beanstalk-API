const { Sequelize } = require('sequelize');
const { TokenModelConfig } = require('./models/token-model');

// Configure database connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  // When running the API in docker: the host needs to be the docker service name
  host: process.env.DB_HOST,
  dialect: 'postgres'
});

// Define models
const TokenModel = sequelize.define(TokenModelConfig.name, TokenModelConfig.attributes, TokenModelConfig.options);

module.exports = {
  sequelize,
  TokenModel
};
