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
      stem: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      depositedAmount: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      // Current recorded deposited bdv
      depositedBdv: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      // Current stalk credited to this deposit (base + grown)
      currentStalk: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      // Base stalk
      baseStalk: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      // Grown stalk that has been mown
      grownStalk: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      // Stem of the previous mow for this deposit
      mowStem: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      // Unmown stalk
      mowableStalk: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      // Current seeds
      currentSeeds: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      // Recorded bdv upon a lambda convert
      bdvOnLambda: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      // Total stalk upon lambda convert. Includes the resulting Mow
      stalkOnLambda: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      },
      // Seeds upon lambda convert
      seedsOnLambda: {
        type: DataTypes.NUMERIC(38, 0),
        allowNull: false
      }
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
