const { setPrimary, setEncrypt, getDecrypt } = require('../config/crypto')
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("District", {
    _id: setPrimary,
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      underscored: true,
      validate: {
        notEmpty: {
          msg: "Tên quận, huyện không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("name", this);
      },
      set(value) {
        setEncrypt(value, "name", this);
      },
    },
  });
}