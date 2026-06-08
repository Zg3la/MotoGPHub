const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { query } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'motogp_hub_secret_2024';

router.post('/register', async (req, res) => {
  const { username, email, password, name } = req.body;

  if (!username || !email || !password || !name)
    return res.status(400).json({ error: 'All fields are required' });
  if (username.length < 3 || username.length > 20)
    return res.status(400).json({ error: 'Username must be 3–20 characters' });
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const colors = ['#E63946','#2A9D8F','#E9C46A','#F4A261','#264653','#6A0572','#0077B6','#00B4D8'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];
    const avatar = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (username, email, password, name, role, avatar, avatar_color, bio, followers)
       VALUES (?, ?, ?, ?, 'fan', ?, ?, '', 0)`,
      [username.toLowerCase(), email.toLowerCase(), hash, name, avatar, avatarColor]
    );

    const id = result.insertId;
    const token = jwt.sign({ id, username: username.toLowerCase(), role: 'fan' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id, username: username.toLowerCase(), name, role: 'fan', avatar, avatarColor }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: 'Could not create account' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  try {
    const rows = await query('SELECT * FROM users WHERE username = ?', [username.toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role, avatar: user.avatar, avatarColor: user.avatar_color }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', require('./auth.middleware').authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
