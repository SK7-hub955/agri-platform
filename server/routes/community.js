import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware, recordAction } from '../auth.js';

const router = Router();

function relativeTime(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function serializePost(row) {
  return {
    id: row.id,
    author: row.author,
    role: row.role,
    text: row.text,
    likes: row.likes,
    time: relativeTime(row.created_at),
  };
}

// GET /api/community/posts  (public)
router.get('/posts', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM community_posts ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, posts: rows.map(serializePost) });
  } catch (error) {
    next(error);
  }
});

// POST /api/community/posts  (auth)
router.post('/posts', authMiddleware, async (req, res, next) => {
  try {
    const text = (req.body?.text || '').trim();
    if (!text) {
      return res.status(400).json({ success: false, error: 'Post text is required.' });
    }
    const role = req.body?.role && req.user.roles.includes(req.body.role) ? req.body.role : req.user.roles[0];
    const { rows } = await query(
      `INSERT INTO community_posts (user_id, author, role, text, likes)
       VALUES ($1, $2, $3, $4, 0) RETURNING *`,
      [req.user.id, req.user.name, role, text],
    );
    await recordAction(req.user.id, 'community_post', { postId: rows[0].id });
    res.status(201).json({ success: true, post: serializePost(rows[0]) });
  } catch (error) {
    next(error);
  }
});

export default router;
