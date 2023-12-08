const { setPrimary, setEncrypt, getDecrypt } = require('../config/crypto')
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Role", {
    _id: setPrimary,
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Tên chức năng không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("name", this);
      },
      set(value) {
        setEncrypt(value, "name", this);
      },
    },
  })
}