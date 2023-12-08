const { setPrimary, setEncrypt, getDecrypt } = require('../config/crypto')
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("PartyCell", {
    _id: setPrimary,
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "tên chi bộ không được bỏ trống"
        },
      },
      get() {
        return getDecrypt("name", this)
      },
      set(value) {
        setEncrypt(value, "name", this)
      }
    }
  })
}