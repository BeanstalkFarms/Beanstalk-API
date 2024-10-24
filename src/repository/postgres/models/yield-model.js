const { bigintNumericColumn } = require('../util/sequelize-util');
const { ApyInitType } = require('./types/types');

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
      // Actual number of datapoints (different from emaWindow if < emaWindow seasons were available)
      emaEffectiveWindow: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      ...bigintNumericColumn('emaBeans', DataTypes, { allowNull: false }),
      initType: {
        type: DataTypes.ENUM,
        values: Object.values(ApyInitType),
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
      tableName: 'yield',
      indexes: [
        {
          unique: true,
          fields: ['tokenId', 'season', 'emaWindow', 'initType']
        }
      ]
    }
  );

  // Associations here
  Yield.associate = (models) => {
    Yield.belongsTo(models.Token, { foreignKey: 'tokenId', onDelete: 'RESTRICT' });
  };

  return Yield;
};
