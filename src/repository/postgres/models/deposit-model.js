const { bigintNumericColumn } = require('../util/sequelize-util');

module.exports = (sequelize, DataTypes) => {
  const Deposit = sequelize.define(
    'Deposit',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      chain: {
        type: DataTypes.STRING,
        allowNull: false
      },
      account: {
        type: DataTypes.STRING,
        allowNull: false
      },
      /// Token added via association below ///
      ...bigintNumericColumn('stem', DataTypes, { allowNull: false }),
      ...bigintNumericColumn('depositedAmount', DataTypes, { allowNull: false }),
      // Current recorded deposited bdv
      ...bigintNumericColumn('depositedBdv', DataTypes, { allowNull: false }),
      // Current stalk credited to this deposit (base + grown)
      ...bigintNumericColumn('currentStalk', DataTypes, { allowNull: false }),
      // Base stalk
      ...bigintNumericColumn('baseStalk', DataTypes, { allowNull: false }),
      // Grown stalk that has been mown
      ...bigintNumericColumn('grownStalk', DataTypes, { allowNull: false }),
      // Stem of the previous mow for this deposit
      ...bigintNumericColumn('mowStem', DataTypes, { allowNull: false }),
      // Unmown stalk
      ...bigintNumericColumn('mowableStalk', DataTypes, { allowNull: false }),
      // Current seeds
      ...bigintNumericColumn('currentSeeds', DataTypes, { allowNull: false }),
      // Recorded bdv upon a lambda convert
      ...bigintNumericColumn('bdvOnLambda', DataTypes, { allowNull: false }),
      // Total stalk upon lambda convert. Includes the resulting Mow
      ...bigintNumericColumn('stalkOnLambda', DataTypes, { allowNull: false }),
      // Seeds upon lambda convert
      ...bigintNumericColumn('seedsOnLambda', DataTypes, { allowNull: false })
    },
    {
      tableName: 'deposit',
      indexes: [
        {
          unique: true,
          fields: ['chain', 'account', 'tokenId', 'stem']
        }
      ]
    }
  );

  // Associations here
  Deposit.associate = (models) => {
    Deposit.belongsTo(models.Token, { foreignKey: 'tokenId', onDelete: 'RESTRICT' });
  };

  return Deposit;
};
