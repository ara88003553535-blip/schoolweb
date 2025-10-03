const express = require('express');
const router = express.Router();
const db = require('../db');
const { ensureAuthenticated, requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const articles = await db.all('SELECT news.*, users.name as authorName FROM news LEFT JOIN users ON news.authorId = users.id ORDER BY createdAt DESC');
  res.render('news_list', { articles });
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const article = await db.get('SELECT news.*, users.name as authorName FROM news LEFT JOIN users ON news.authorId = users.id WHERE news.id = ?', [id]);
  if (!article) return res.status(404).send('Not found');
  const comments = await db.all('SELECT comments.*, users.name as authorName FROM comments LEFT JOIN users ON comments.userId = users.id WHERE newsId = ? ORDER BY createdAt', [id]);
  const likes = await db.all('SELECT value, COUNT(*) as cnt FROM likes WHERE newsId = ? GROUP BY value', [id]);
  let likeCount = 0, dislikeCount = 0;
  likes.forEach(l => { if (l.value === 1) likeCount = l.cnt; if (l.value === -1) dislikeCount = l.cnt; });
  res.render('news_view', { article, comments, likeCount, dislikeCount });
});

// posting new article - admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { title, body } = req.body;
  await db.run('INSERT INTO news (title, body, authorId) VALUES (?,?,?)', [title, body, req.user.id]);
  res.redirect('/news');
});

// comment
router.post('/:id/comment', ensureAuthenticated, async (req, res) => {
  const id = req.params.id;
  await db.run('INSERT INTO comments (newsId, userId, body) VALUES (?,?,?)', [id, req.user.id, req.body.body]);
  res.redirect('/news/' + id);
});

// like/dislike
router.post('/:id/like', ensureAuthenticated, async (req, res) => {
  const id = req.params.id;
  const val = parseInt(req.body.value) || 1;
  // replace existing
  await db.run('DELETE FROM likes WHERE newsId = ? AND userId = ?', [id, req.user.id]);
  await db.run('INSERT INTO likes (newsId, userId, value) VALUES (?,?,?)', [id, req.user.id, val]);
  res.redirect('/news/' + id);
});

module.exports = router;
