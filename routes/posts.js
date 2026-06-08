const express = require('express');
const router  = express.Router();
const { query } = require('../db/database');
const { authMiddleware, optionalAuth } = require('./auth.middleware');

function mapPost(row, userVote = null) {
  return {
    _id:              row.id,
    userId:           row.user_id,
    username:         row.username,
    authorName:       row.author_name,
    authorAvatar:     row.author_avatar,
    authorAvatarColor:row.author_avatar_color,
    authorRole:       row.author_role,
    content:          row.content,
    status:           row.status,
    likes:            row.likes,
    dislikes:         row.dislikes,
    commentCount:     row.comment_count,
    createdAt:        row.created_at,
    userVote,
  };
}

function mapComment(row) {
  return {
    _id:              row.id,
    postId:           row.post_id,
    userId:           row.user_id,
    username:         row.username,
    authorName:       row.author_name,
    authorAvatar:     row.author_avatar,
    authorAvatarColor:row.author_avatar_color,
    content:          row.content,
    createdAt:        row.created_at,
  };
}

router.get('/', optionalAuth, async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const posts = await query(
      'SELECT * FROM posts WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      ['approved', limit, offset]
    );

    if (!req.user) {
      return res.json({ posts: posts.map(p => mapPost(p)), hasMore: posts.length === limit });
    }

    const postIds = posts.map(p => p.id);
    let likeMap = {};
    if (postIds.length) {
      const userLikes = await query(
        `SELECT post_id, type FROM likes WHERE user_id = ? AND post_id IN (${postIds.map(() => '?').join(',')})`,
        [req.user.id, ...postIds]
      );
      userLikes.forEach(l => { likeMap[l.post_id] = l.type; });
    }

    const enriched = posts.map(p => mapPost(p, likeMap[p.id] || null));
    res.json({ posts: enriched, hasMore: posts.length === limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Post content cannot be empty' });
  if (content.length > 500)        return res.status(400).json({ error: 'Post too long (max 500 characters)' });

  try {
    const users = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const status = (user.role === 'admin' || user.role === 'driver') ? 'approved' : 'pending';

    const result = await query(
      `INSERT INTO posts (user_id, username, author_name, author_avatar, author_avatar_color, author_role, content, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.username, user.name, user.avatar, user.avatar_color, user.role, content.trim(), status]
    );

    const rows = await query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
    res.status(201).json(mapPost(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const rows = await query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Post not found' });

    await query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

router.post('/:id/vote', authMiddleware, async (req, res) => {
  const { type } = req.body;
  if (!['like', 'dislike'].includes(type)) return res.status(400).json({ error: 'Invalid vote type' });

  try {
    const existing = await query(
      'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existing.length) {
      if (existing[0].type === type) {

        await query('DELETE FROM likes WHERE id = ?', [existing[0].id]);
        const col = type === 'like' ? 'likes' : 'dislikes';
        await query(`UPDATE posts SET ${col} = ${col} - 1 WHERE id = ?`, [req.params.id]);
        const post = (await query('SELECT * FROM posts WHERE id = ?', [req.params.id]))[0];
        return res.json(mapPost(post, null));
      } else {

        await query('UPDATE likes SET type = ? WHERE id = ?', [type, existing[0].id]);
        if (type === 'like') {
          await query('UPDATE posts SET likes = likes + 1, dislikes = dislikes - 1 WHERE id = ?', [req.params.id]);
        } else {
          await query('UPDATE posts SET likes = likes - 1, dislikes = dislikes + 1 WHERE id = ?', [req.params.id]);
        }
        const post = (await query('SELECT * FROM posts WHERE id = ?', [req.params.id]))[0];
        return res.json(mapPost(post, type));
      }
    } else {
      await query('INSERT INTO likes (post_id, user_id, type) VALUES (?, ?, ?)', [req.params.id, req.user.id, type]);
      const col = type === 'like' ? 'likes' : 'dislikes';
      await query(`UPDATE posts SET ${col} = ${col} + 1 WHERE id = ?`, [req.params.id]);
      const post = (await query('SELECT * FROM posts WHERE id = ?', [req.params.id]))[0];
      return res.json(mapPost(post, type));
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await query(
      'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(comments.map(mapComment));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:id/comments', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
  if (content.length > 300)        return res.status(400).json({ error: 'Comment too long (max 300 chars)' });

  try {
    const users = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await query(
      `INSERT INTO comments (post_id, user_id, username, author_name, author_avatar, author_avatar_color, content)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, user.id, user.username, user.name, user.avatar, user.avatar_color, content.trim()]
    );

    await query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [req.params.id]);
    const comment = (await query('SELECT * FROM comments WHERE id = ?', [result.insertId]))[0];
    res.status(201).json(mapComment(comment));
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.delete('/:postId/comments/:commentId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const comment = (await query('SELECT * FROM comments WHERE id = ?', [req.params.commentId]))[0];
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    await query('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
    await query('UPDATE posts SET comment_count = comment_count - 1 WHERE id = ?', [req.params.postId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

router.get('/admin/pending', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const posts = await query('SELECT * FROM posts WHERE status = ? ORDER BY created_at ASC', ['pending']);
    res.json(posts.map(p => mapPost(p)));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending posts' });
  }
});

router.patch('/admin/:id/approve', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    await query("UPDATE posts SET status = 'approved' WHERE id = ?", [req.params.id]);
    const post = (await query('SELECT * FROM posts WHERE id = ?', [req.params.id]))[0];
    res.json(mapPost(post));
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve post' });
  }
});

router.delete('/admin/:id/reject', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    await query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject post' });
  }
});

module.exports = router;
