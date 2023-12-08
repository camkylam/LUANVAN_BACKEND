const { setPrimary, setEncrypt, getDecrypt } = require('../config/crypto')
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Account", {
    _id: setPrimary,
    user_name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Tên đăng nhập không được bỏ trống.",
        },
      },
      validate: {
        notEmpty: {
          msg: "Mật khẩu không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("user_name", this);
      },
      set(value) {
        setEncrypt(value, "user_name", this);
      },
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        return getDecrypt("password", this);
      },
      set(value) {
        setEncrypt(value, "password", this);
      },
    },
  })
}