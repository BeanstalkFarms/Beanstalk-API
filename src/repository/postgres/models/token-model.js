// id (pk)
// token
// name
// decimals
// isWhitelisted
// stalkEarnedPerSeason
// stemTip

const { DataTypes } = require('sequelize');

const TokenModelConfig = {
  name: 'Token',
  attributes: {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    decimals: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isWhitelisted: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    stalkEarnedPerSeason: {
      type: DataTypes.BIGINT
    },
    stemTip: {
      type: DataTypes.BIGINT
    }
  },
  options: {
    tableName: 'token',
    underscored: true
  }
};

module.exports = {
  TokenModelConfig
};
