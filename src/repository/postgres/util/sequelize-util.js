function bigintToDecStr(bi) {
  return bi !== null ? bi.toString() : null;
}

function bigintToHexStr(bi) {
  return bi !== null ? `0x${bi.toString(16)}` : null;
}

function bigintFrom(decOrHex) {
  return decOrHex !== null ? BigInt(decOrHex) : null;
}

// Include getter for transforming to BigInt from NUMERIC in runtime models
const bigintNumericColumn = (column, Sequelize, attributes = {}) => {
  return {
    [column]: {
      type: Sequelize.NUMERIC(38, 0),
      ...attributes,
      get() {
        const value = this.getDataValue(column);
        return value ? bigintFrom(value) : undefined;
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
  bigintNumericColumn,
  timestamps
};
