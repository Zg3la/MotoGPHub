const express = require('express');
const router  = express.Router();
const { query } = require('../db/database');
const { authMiddleware, optionalAuth } = require('./auth.middleware');

function mapDiscussion(row) {
  return { _id: row.id, title: row.title, active: !!row.active, createdBy: row.created_by, createdAt: row.created_at };
}

function mapMessage(row) {
  return {
    _id:              row.id,
    discussionId:     row.discussion_id,
    userId:           row.user_id,
    username:         row.username,
    authorName:       row.author_name,
    authorAvatar:     row.author_avatar,
    authorAvatarColor:row.author_avatar_color,
    authorRole:       row.author_role,
    content:          row.content,
    createdAt:        row.created_at,
  };
}

router.get('/discussion', optionalAuth, async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM live_discussions WHERE active = 1 ORDER BY created_at DESC LIMIT 1'
    );
    res.json({ discussion: rows[0] ? mapDiscussion(rows[0]) : null });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/discussion', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { title } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  try {
    await query('UPDATE live_discussions SET active = 0 WHERE active = 1');
    const result = await query(
      'INSERT INTO live_discussions (title, active, created_by) VALUES (?, 1, ?)',
      [title.trim(), req.user.username]
    );
    const discussion = (await query('SELECT * FROM live_discussions WHERE id = ?', [result.insertId]))[0];
    res.status(201).json({ discussion: mapDiscussion(discussion) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create discussion' });
  }
});

router.delete('/discussion', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    await query('UPDATE live_discussions SET active = 0 WHERE active = 1');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to close discussion' });
  }
});

router.get('/discussion/messages', optionalAuth, async (req, res) => {
  try {
    const disc = await query('SELECT * FROM live_discussions WHERE active = 1 LIMIT 1');
    if (!disc[0]) return res.json({ messages: [] });

    const since = req.query.since ? new Date(req.query.since) : new Date(0);
    const sinceStr = since.toISOString().slice(0, 19).replace('T', ' ');

    const messages = await query(
      'SELECT * FROM live_messages WHERE discussion_id = ? AND created_at > ? ORDER BY created_at ASC',
      [disc[0].id, sinceStr]
    );
    res.json({ messages: messages.map(mapMessage) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/discussion/messages', authMiddleware, async (req, res) => {
  const { content, discussionId } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
  if (content.length > 300)        return res.status(400).json({ error: 'Message too long (max 300 chars)' });

  try {
    const disc = await query('SELECT * FROM live_discussions WHERE id = ? AND active = 1', [discussionId]);
    if (!disc[0]) return res.status(404).json({ error: 'Discussion not found or closed' });

    const users = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await query(
      `INSERT INTO live_messages (discussion_id, user_id, username, author_name, author_avatar, author_avatar_color, author_role, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [disc[0].id, user.id, user.username, user.name, user.avatar, user.avatar_color, user.role, content.trim()]
    );
    const message = (await query('SELECT * FROM live_messages WHERE id = ?', [result.insertId]))[0];
    res.status(201).json({ message: mapMessage(message) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
