const { bigintStringColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const Yield = sequelize.define(
    'Yield',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      season: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      emaWindow: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      ...bigintStringColumn('emaBeans', DataTypes, { allowNull: false }),
      initType: {
        type: DataTypes.ENUM,
        values: ['NEW', 'AVERAGE'],
        allowNull: false
      },
      beanYield: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      stalkYield: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      ownershipYield: {
        type: DataTypes.FLOAT,
        allowNull: false
      }
    },
    {
      tableName: 'yield'
    }
  );

  // Associations here
  Yield.associate = (models) => {
    Yield.belongsTo(models.Token, { foreignKey: 'tokenId', onDelete: 'RESTRICT' });
  };

  return Yield;
};
