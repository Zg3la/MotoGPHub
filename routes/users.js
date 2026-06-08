const express = require('express');
const router  = express.Router();
const { query } = require('../db/database');
const { authMiddleware, optionalAuth } = require('./auth.middleware');

function mapUser(row, extra = {}) {
  const { password, email, avatar_color, created_at, ...rest } = row;
  return { ...rest, avatarColor: avatar_color, createdAt: created_at, ...extra };
}

router.get('/drivers', optionalAuth, async (req, res) => {
  try {
    const drivers = await query(
      "SELECT * FROM users WHERE role = 'driver' ORDER BY name ASC"
    );
    const safe = drivers.map(d => mapUser(d));

    if (!req.user) return res.json(safe);

    const follows = await query('SELECT following_id FROM follows WHERE follower_id = ?', [req.user.id]);
    const followSet = new Set(follows.map(f => f.following_id));
    const enriched = safe.map(d => ({ ...d, isFollowing: followSet.has(d.id) }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM users WHERE username = ?', [req.params.username]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const safe = mapUser(user);
    if (!req.user) return res.json({ ...safe, isFollowing: false });

    const follow = await query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, user.id]
    );
    res.json({ ...safe, isFollowing: follow.length > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:username/posts', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    let requestingUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        requestingUser = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'motogp_hub_secret_2024');
      } catch {}
    }

    const rows = await query('SELECT * FROM users WHERE username = ?', [req.params.username]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isOwner = requestingUser && requestingUser.id === user.id;
    const isAdmin = requestingUser && requestingUser.role === 'admin';

    let posts;
    if (isOwner || isAdmin) {
      posts = await query('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC', [user.id]);
    } else {
      posts = await query(
        "SELECT * FROM posts WHERE user_id = ? AND status = 'approved' ORDER BY created_at DESC",
        [user.id]
      );
    }

    res.json(posts.map(p => ({
      _id: p.id, userId: p.user_id, username: p.username,
      authorName: p.author_name, authorAvatar: p.author_avatar,
      authorAvatarColor: p.author_avatar_color, authorRole: p.author_role,
      content: p.content, status: p.status,
      likes: p.likes, dislikes: p.dislikes, commentCount: p.comment_count,
      createdAt: p.created_at,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/:username/follow', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM users WHERE username = ?', [req.params.username]);
    const target = rows[0];
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

    const existing = await query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.id, target.id]
    );

    if (existing.length) {
      await query('DELETE FROM follows WHERE id = ?', [existing[0].id]);
      await query('UPDATE users SET followers = followers - 1 WHERE id = ?', [target.id]);
      const updated = (await query('SELECT * FROM users WHERE id = ?', [target.id]))[0];
      return res.json({ ...mapUser(updated), isFollowing: false });
    } else {
      await query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.id, target.id]);
      await query('UPDATE users SET followers = followers + 1 WHERE id = ?', [target.id]);
      const updated = (await query('SELECT * FROM users WHERE id = ?', [target.id]))[0];
      return res.json({ ...mapUser(updated), isFollowing: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/me/bio', authMiddleware, async (req, res) => {
  const { bio } = req.body;
  if (bio === undefined) return res.status(400).json({ error: 'Bio required' });
  if (bio.length > 200)  return res.status(400).json({ error: 'Bio too long (max 200 chars)' });

  try {
    await query('UPDATE users SET bio = ? WHERE id = ?', [bio, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bio' });
  }
});

module.exports = router;
