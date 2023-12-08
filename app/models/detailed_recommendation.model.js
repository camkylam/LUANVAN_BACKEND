const { DataTypes } = require("sequelize");
const { setPrimary, getDecrypt, setEncrypt } = require('../config/crypto')

module.exports = (sequelize) => {
  return sequelize.define("Detailed_Recommendation", {
    _id: setPrimary,
    exemption: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'False',
      validate: {
        notEmpty: {
          msg: "miễn trừ không được bỏ trống"
        },
      },
      get() {
        return getDecrypt("exemption", this);
      },
      set(value) {
        setEncrypt(value, "exemption", this);
      }
    },
  });
}