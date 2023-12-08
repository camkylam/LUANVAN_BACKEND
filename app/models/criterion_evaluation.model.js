const { setPrimary, setEncrypt, getDecrypt } = require('../config/crypto')
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Criterion_Evaluation", {
    _id: setPrimary,
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      get() {
        return getDecrypt("name", this);
      },
      set(value) {
        setEncrypt(value, "name", this);
      },
    },
  })
}