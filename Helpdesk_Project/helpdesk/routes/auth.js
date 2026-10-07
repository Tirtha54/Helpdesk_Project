const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../db');
const crypto = require('crypto');
const { sendResetMail } = require('../mailer');

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6) {
  return res.status(400).json({ message: 'Password must be at least 6 characters' });
}
  }

  try {
    const pool = await poolPromise;

    
    const check = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT id FROM users WHERE email = @email');

    if (check.recordset.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    
    const hashed = await bcrypt.hash(password, 10);

    await pool.request()
      .input('name', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashed)
      .query('INSERT INTO users (name, email, password) VALUES (@name, @email, @password)');

    res.json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM users WHERE email = @email');

    const user = result.recordset[0];
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1d' });

    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT id, name FROM users WHERE email = @email');

    const user = result.recordset[0];
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      await pool.request()
        .input('id', sql.Int, user.id)
        .input('token', sql.VarChar, token)
        .input('expiry', sql.DateTime, expiry)
        .query('UPDATE users SET reset_token = @token, reset_expiry = @expiry WHERE id = @id');

      sendResetMail(email, user.name, 'http://localhost:3000/reset.html?token=' + token);
    }
    res.json({ message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) {
    console.log('FORGOT ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('token', sql.VarChar, token)
      .input('now', sql.DateTime, new Date())
      .query('SELECT id FROM users WHERE reset_token = @token AND reset_expiry > @now');

    const user = result.recordset[0];
    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await pool.request()
      .input('id', sql.Int, user.id)
      .input('password', sql.VarChar, hashed)
      .query('UPDATE users SET password = @password, reset_token = NULL, reset_expiry = NULL WHERE id = @id');

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.log('RESET ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;