const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST,         
    user: process.env.DB_USER,          
    // password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,     
    port: process.env.DB_PORT || 3306,      
});


module.exports = db;
