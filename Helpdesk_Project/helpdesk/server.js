require('dotenv').config();
const express = require('express');
const { poolPromise } = require('./db');


const app = express();

app.use(express.json());
app.use(express.static('public'));


app.get('/api/test', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT COUNT(*) AS total FROM users');
  res.json({ message: 'Server is working', users: result.recordset[0].total });
});


app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/profile', require('./routes/profile'));

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});