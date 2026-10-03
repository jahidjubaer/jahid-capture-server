const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const admin = await Admin.findOne({ username });
  const ok = admin && (await bcrypt.compare(password, admin.passwordHash));
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, admin: { id: admin._id, username: admin.username } });
}

async function me(req, res) {
  res.json({ admin: { id: req.admin._id, username: req.admin.username } });
}

module.exports = { login, me };
