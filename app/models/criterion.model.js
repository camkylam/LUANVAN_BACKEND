const { setPrimary, setEncrypt, getDecrypt } = require('../config/crypto')
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Criterion", {
    _id: setPrimary,
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Tên tiêu chí không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("name", this);
      },
      set(value) {
        setEncrypt(value, "name", this);
      },
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Thứ tự tiêu chí không được bỏ trống' }
      }
    },
    exemption: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "miễn trừ không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("exemption", this);
      },
      set(value) {
        setEncrypt(value, "exemption", this);
      },
    }
  })
}