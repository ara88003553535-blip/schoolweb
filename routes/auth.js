const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/login', (req, res) => {
  const timeout = req.query.timeout;
  res.render('login', { timeout });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.render('login', { error: 'Invalid email or password' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.render('login', { error: 'Invalid email or password' });
  req.session.userId = user.id;
  req.session.lastActivity = Date.now();
  res.redirect('/');
});

router.get('/register', (req, res) => res.render('register'));
router.post('/register', async (req, res) => {
  const { name, email, password, role, classId } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await db.run('INSERT INTO users (name, email, password, role, classId) VALUES (?,?,?,?,?)', [name, email, hash, role || 'student', classId || null]);
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Could not register (maybe email taken)' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
