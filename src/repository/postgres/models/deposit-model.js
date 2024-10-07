const { bigintStringColumn } = require('../util/sequelize-util');

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
      ...bigintStringColumn('stem', DataTypes, { allowNull: false }),
      /// Token added via association below ///

      ...bigintStringColumn('depositedAmount', DataTypes, { allowNull: false }),
      // Current recorded deposited bdv
      ...bigintStringColumn('depositedBdv', DataTypes, { allowNull: false }),
      // Current stalk credited to this deposit (base + grown)
      ...bigintStringColumn('currentStalk', DataTypes, { allowNull: false }),
      // Base stalk
      ...bigintStringColumn('baseStalk', DataTypes, { allowNull: false }),
      // Grown stalk that has been mown
      ...bigintStringColumn('grownStalk', DataTypes, { allowNull: false }),
      // Stem of the previous mow for this deposit
      ...bigintStringColumn('mowStem', DataTypes, { allowNull: false }),
      // Unmown stalk
      ...bigintStringColumn('mowableStalk', DataTypes, { allowNull: false }),
      // Current seeds
      ...bigintStringColumn('currentSeeds', DataTypes, { allowNull: false }),
      // Recorded bdv upon a lambda convert
      ...bigintStringColumn('bdvOnLambda', DataTypes, { allowNull: false }),
      // Total stalk upon lambda convert. Includes the resulting Mow
      ...bigintStringColumn('stalkOnLambda', DataTypes, { allowNull: false }),
      // Seeds upon lambda convert
      ...bigintStringColumn('seedsOnLambda', DataTypes, { allowNull: false })
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
