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
      supply: {
        type: DataTypes.NUMERIC(38, 0),
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
      bdv: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      stalkEarnedPerSeason: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      stemTip: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      totalDeposited: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      totalDepositedBdv: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      }
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
