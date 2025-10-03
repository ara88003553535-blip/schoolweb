const express = require('express');
const router = express.Router();
const fs = require('fs');
const db = require('../db');
const { requireRole, ensureAuthenticated } = require('../middleware/auth');

const PERM_FILE = './config/permissions.json';

router.use(requireRole('admin'));

router.get('/', async (req, res) => {
  const permissions = JSON.parse(fs.readFileSync(PERM_FILE, 'utf8'));
  const articles = await db.all('SELECT * FROM news ORDER BY createdAt DESC');
  const schedules = await db.all('SELECT * FROM schedules');
  res.render('admin', { permissions, articles, schedules });
});

router.post('/permissions', (req, res) => {
  const content = req.body.content;
  try {
    JSON.parse(content);
    fs.writeFileSync(PERM_FILE, content);
    res.redirect('/admin');
  } catch (err) {
    res.status(400).send('Invalid JSON');
  }
});

module.exports = router;
