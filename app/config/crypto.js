const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { DataTypes } = require("sequelize");
const encryptionKey = "12345678912345678901234567890121";
const iv = "0123456789abcdef";

const setPrimary = {
  type: DataTypes.STRING,
  defaultValue: () => uuidv4(),
  primaryKey: true,
};

const setEncrypt = (value, name, modelInstance) => {
  if (value.length == 0) {
    let encrypted = "";
    modelInstance.setDataValue(name, encrypted);
  } else {
    const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");
    modelInstance.setDataValue(name, encrypted);
  }
};

const getDecrypt = (name, modelInstance) => {
  const value = modelInstance.getDataValue(name);
  if (value) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv);
    let decrypted = decipher.update(value, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
  return null;
};

const encrypt = (value) => {
  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv);
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

const decrypt = (name) => {
  if (name) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv);
    let decrypted = decipher.update(name, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
  return null
};

module.exports = {
  setPrimary,
  setEncrypt,
  getDecrypt,
  encrypt,
  decrypt
}