const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool
const urlDB = `mysql://${process.env.MYSQLUSER}:${process.env.MYSQLPASSWORD}@${process.env.MYSQLHOST}:${process.env.MYSQLPORT}/${process.env.MYSQL_DATABASE}`;


const db = mysql.createPool(urlDB);


module.exports = db;