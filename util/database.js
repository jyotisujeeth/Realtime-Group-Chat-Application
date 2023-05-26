const Sequelize = require("sequelize");
require("dotenv").config();

console.log("PASSWORD>>>>>>>>>>>>>>>>>>>>>>>>>=>",process.env.DB_PASSWORD)
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME,process.env.DB_PASSWORD, {
    dialect: "mysql",
    host: process.env.DB_HOST
});

module.exports = sequelize;