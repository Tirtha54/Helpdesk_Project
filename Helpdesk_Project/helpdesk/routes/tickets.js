const express = require('express');
const { sql, poolPromise } = require('../db');
const { checkLogin, checkAdmin } = require('../middleware/auth');

const router = express.Router();
const { sendStatusMail } = require('../mailer');


router.post('/', checkLogin, async (req, res) => {
  const { title, description, priority, category } = req.body;
  console.log('CATEGORY RECEIVED:', category);
  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('title', sql.VarChar, title)
      .input('description', sql.VarChar, description)
      .input('priority', sql.VarChar, priority || 'Medium')
      .input('category', sql.VarChar, category || 'IT Issue')
      .query('INSERT INTO tickets (user_id, title, description, priority, category) VALUES (@user_id, @title, @description, @priority, @category)');
    res.json({ message: 'Ticket raised successfully' });
  } catch (err) {
    console.log('TICKET ERROR:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/my', checkLogin, async (req, res) => {
  const search = '%' + (req.query.search || '') + '%';
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('search', sql.VarChar, search)
      .query('SELECT * FROM tickets WHERE user_id = @user_id AND title LIKE @search ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/stats', checkLogin, checkAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT COUNT(*) AS total,
        ISNULL(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) AS pending,
        ISNULL(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0) AS inProgress,
        ISNULL(SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END), 0) AS resolved
      FROM tickets`);
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/', checkLogin, checkAdmin, async (req, res) => {
  const search = '%' + (req.query.search || '') + '%';
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('search', sql.VarChar, search)
      .query(`SELECT t.*, u.name AS user_name FROM tickets t
              JOIN users u ON t.user_id = u.id
              WHERE t.title LIKE @search OR u.name LIKE @search
              ORDER BY t.created_at DESC`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:id', checkLogin, checkAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.VarChar, req.body.status)
      .query('UPDATE tickets SET status = @status WHERE id = @id');

    
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT u.email, u.name, t.title FROM tickets t JOIN users u ON t.user_id = u.id WHERE t.id = @id');

    const row = result.recordset[0];
    if (row) {
      sendStatusMail(row.email, row.name, row.title, req.body.status);
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', checkLogin, checkAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM tickets WHERE id = @id');
    res.json({ message: 'Ticket deleted' });
     } catch (err) {
    console.log('TICKET ERROR:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;