const express = require('express');
const multer = require('multer');
const path = require('path');
const { sql, poolPromise } = require('../db');
const { checkLogin } = require('../middleware/auth');

const router = express.Router();


const storage = multer.diskStorage({
  destination: 'public/uploads',
  filename: (req, file, cb) => {
    cb(null, 'user' + req.user.id + '_' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },   // max 2 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});


router.get('/', checkLogin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT name, email, role, profile_pic FROM users WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/', checkLogin, async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('name', sql.VarChar, req.body.name)
      .query('UPDATE users SET name = @name WHERE id = @id');
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/picture', checkLogin, (req, res) => {
  upload.single('picture')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose a picture' });
    }
    try {
      const picPath = '/uploads/' + req.file.filename;
      const pool = await poolPromise;
      await pool.request()
        .input('id', sql.Int, req.user.id)
        .input('pic', sql.VarChar, picPath)
        .query('UPDATE users SET profile_pic = @pic WHERE id = @id');
      res.json({ message: 'Picture uploaded', profile_pic: picPath });
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });
});

module.exports = router;