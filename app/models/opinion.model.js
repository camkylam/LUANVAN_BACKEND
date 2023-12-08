const { DataTypes } = require("sequelize");
const { setPrimary } = require('../config/crypto')

module.exports = (sequelize) => {
  return sequelize.define("Opinion", {
    _id: setPrimary,
  });
}