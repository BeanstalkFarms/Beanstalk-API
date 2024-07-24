const { DataTypes } = require('sequelize');

const TestModelConfig = {
  name: 'TestModel',
  attributes: {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    counter: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  options: {}
};

module.exports = {
  TestModelConfig
};
