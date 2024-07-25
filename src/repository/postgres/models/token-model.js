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
      stalkEarnedPerSeason: {
        type: DataTypes.BIGINT
      },
      stemTip: {
        type: DataTypes.BIGINT
      }
    },
    {
      tableName: 'token',
      underscored: true
    }
  );

  // Associations here

  return Token;
};
