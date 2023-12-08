const { setPrimary, setEncrypt, getDecrypt } = require('../config/crypto')
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Permission_Types", {
    _id: setPrimary,
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Tên loại quyền không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("name", this)
      },
      set(value) {
        setEncrypt(value, "name", this)
      },
    },
  })
}