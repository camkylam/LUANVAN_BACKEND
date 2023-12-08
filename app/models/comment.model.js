const { DataTypes } = require("sequelize");
const { setPrimary, setEncrypt, getDecrypt } = require('../config/crypto')

module.exports = (sequelize) => {
  return sequelize.define("Comment", {
    _id: setPrimary,
    note: {
      type: DataTypes.TEXT,
      allowNull: null,
      defaultValue: null,
      get() {
        return getDecrypt("note", this);
      },
      set(value) {
        setEncrypt(value, "note", this);
      },
    },
  });
}