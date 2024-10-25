const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const Token = sequelize.define(
    'Token',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      chain: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      symbol: {
        type: DataTypes.STRING,
        allowNull: false
      },
      ...bigintNumericColumn('supply', DataTypes, { allowNull: false }),
      decimals: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      isWhitelisted: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      ...bigintNumericColumn('bdv', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('stalkEarnedPerSeason', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('stemTip', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('totalDeposited', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('totalDepositedBdv', DataTypes, { allowNull: false })
    },
    {
      tableName: 'token',
      indexes: [
        {
          unique: true,
          fields: ['address', 'chain']
        }
      ]
    }
  );

  // Associations here
  Token.associate = (models) => {
    Token.hasMany(models.Yield, { foreignKey: 'tokenId' });
  };

  return Token;
};
