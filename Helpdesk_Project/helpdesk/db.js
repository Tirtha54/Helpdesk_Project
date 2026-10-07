const sql = require('mssql');


const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'helpdesk',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};


const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('SQL Server connected');
    return pool;
  })
  .catch((err) => console.log('DB error:', err.message));

module.exports = { sql, poolPromise };