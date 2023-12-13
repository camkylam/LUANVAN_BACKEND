const app = require("./app");
const { config, connection, sequelize, createTable } = require("./app/config/index");

connection();

const PORT = config.app.port;

