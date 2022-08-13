// require('dotenv').config();
// const { createConnection } = require('mysql');
// Create connection variable
// let connection;
// // Connect to DB
// (function handleConnection() {
//     connection = createConnection({
//         host: process.env.DBHOST,
//         user: process.env.DBUSER,
//         password: process.env.DBPASSWORD,
//         port: process.env.dbPORT,
//         database: process.env.DBNAME,
//         multipleStatements: true
//     });
    
//     connection.connect( (err)=> {
//         if(err) throw err 
    
//     });
//     connection.on('error', (err)=> {
//         if(err.code === 'PROTOCOL_CONNECTION_LOST') {
//             handleConnection();
//         }else {
//             // throw err;
//             console.log(err);
//         }
//     })    
// })(); 
            
// module.exports = connection;

// This file will create a connection to the database
const mysql = require("mysql");
require('dotenv').config()
const { createPool } = require('mysql');
// Here to is use across multiple files. Used to make SQL queries to DB
const con = createPool({
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        password: process.env.DBPASSWORD,
        port: process.env.dbPORT,
        database: process.env.DBNAME,
        multipleStatements: true,
        connectionLimit: 10
});

module.exports = con;
