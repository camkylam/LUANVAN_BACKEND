const { DataTypes } = require("sequelize");
const { setPrimary } = require('../config/crypto')

module.exports = (sequelize) => {
  return sequelize.define("Recommendation", {
    _id: setPrimary,
    confirmedAt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    acceptedAt: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  });
}