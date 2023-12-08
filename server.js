const app = require("./app");
const { config, connection, sequelize, createTable } = require("./app/config/index");

// connect to the database
connection();
// createTable()
// start server
const PORT = config.app.port;

// app.listen(PORT, () => {
//     console.log(`Server is listening on port ${PORT}`);
// })

