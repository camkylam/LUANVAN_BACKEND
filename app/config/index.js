const Sequelize = require("sequelize");

const config = {
  app: {
    port: process.env.PORT || 3000,
  },
};

// Khởi tạo kết nối database
const databaseName = process.env.DATABASE_NAME;
const databaseUser = process.env.DATABASE_USER;
const databasePassword = process.env.DATABASE_PASSWORD;
const sequelize = new Sequelize(databaseName, databaseUser, databasePassword, {
  host: "localhost",
  dialect: "mysql",
  port: 3306,
  logging: false,
});

// connect to the database
const connection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

// auto create table
const createTable = () => {
  try {
    sequelize.sync();
    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

module.exports = { config, connection, sequelize, createTable };
