function bigintToDecStr(bi) {
  return bi !== null ? bi.toString() : null;
}

function bigintToHexStr(bi) {
  return bi !== null ? `0x${bi.toString(16)}` : null;
}

function bigintFrom(decOrHex) {
  return decOrHex !== null ? BigInt(decOrHex) : null;
}

// Includes Getters/Setters for transforming between BigInt/string in runtime models
const bigintStringColumn = (column, Sequelize, attributes = {}) => {
  return {
    [column]: {
      type: Sequelize.STRING,
      ...attributes,
      get() {
        const value = this.getDataValue(column);
        return value ? bigintFrom(value) : undefined;
      },
      set(bigintValue) {
        this.setDataValue(column, bigintToDecStr(bigintValue));
      }
    }
  };
};

// For adding timestamps to migration schema
const timestamps = (Sequelize) => {
  return {
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  };
};

module.exports = {
  bigintStringColumn,
  timestamps
};
