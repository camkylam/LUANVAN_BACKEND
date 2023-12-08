const { setPrimary, setEncrypt, getDecrypt } = require('../config/crypto')
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("PartyMember", {
    _id: setPrimary,
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Tên đảng viên không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("name", this);
      },
      set(value) {
        setEncrypt(value, "name", this);
      },
    },
    birthday: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Ngày sinh đảng viên không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("birthday", this);
      },
      set(value) {
        setEncrypt(value, "birthday", this);
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Địa chỉ đảng viên không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("address", this);
      },
      set(value) {
        setEncrypt(value, "address", this);
      },
    },
    phone: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Số điện thoại đảng viên không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("phone", this);
      },
      set(value) {
        setEncrypt(value, "phone", this);
      },
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Email đảng viên không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("email", this);
      },
      set(value) {
        setEncrypt(value, "email", this);
      },
    },
    gender: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "giới tính đảng viên không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("gender", this);
      },
      set(value) {
        setEncrypt(value, "gender", this);
      },
    },
    dateJoin: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "ngày vào đảng không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("dateJoin", this);
      },
      set(value) {
        setEncrypt(value, "dateJoin", this);
      },
    },
    dateOfficial: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        return getDecrypt("dateOfficial", this);
      },
      set(value) {
        setEncrypt(value, "dateOfficial", this);
      },
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Mã số đảng viên không được bỏ trống.",
        },
      },
      get() {
        return getDecrypt("code", this);
      },
      set(value) {
        setEncrypt(value, "code", this);
      },
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