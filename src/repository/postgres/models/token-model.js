const { bigintStringColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const Token = sequelize.define(
    'Token',
    {
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
      symbol: {
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
      ...bigintStringColumn('bdv', DataTypes),
      ...bigintStringColumn('stalkEarnedPerSeason', DataTypes),
      ...bigintStringColumn('stemTip', DataTypes),
      ...bigintStringColumn('totalDeposited', DataTypes),
      ...bigintStringColumn('totalDepositedBdv', DataTypes)
    },
    {
      tableName: 'token'
    }
  );

  // Associations here
  Token.associate = (models) => {
    Token.hasMany(models.Yield, { foreignKey: 'tokenId' });
  };

  return Token;
};
