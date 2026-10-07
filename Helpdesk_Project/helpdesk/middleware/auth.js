const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

// check if the user is logged in
function checkLogin(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Please login first' });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// check if the user is an admin
function checkAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
}

module.exports = { checkLogin, checkAdmin };