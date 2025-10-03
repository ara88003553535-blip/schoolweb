const express = require('express');
const router = express.Router();
const db = require('../db');
const { ensureAuthenticated, requireRole } = require('../middleware/auth');

// view class schedule (public)
router.get('/class/:classId', async (req, res) => {
  const classId = req.params.classId;
  const schedule = await db.get('SELECT * FROM schedules WHERE ownerType = ? AND ownerId = ?', ['class', classId]);
  res.render('schedule', { schedule: schedule ? JSON.parse(schedule.data) : null, owner: `Class ${classId}` });
});

// view personal schedule - only owner or admin
router.get('/user/:userId', ensureAuthenticated, async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (req.user.role !== 'admin' && req.user.id !== userId) return res.status(403).send('Forbidden');
  const schedule = await db.get('SELECT * FROM schedules WHERE ownerType = ? AND ownerId = ?', ['user', userId]);
  res.render('schedule', { schedule: schedule ? JSON.parse(schedule.data) : null, owner: `User ${userId}` });
});

// admin can set schedules
router.post('/set', requireRole('admin'), async (req, res) => {
  const { ownerType, ownerId, data } = req.body;
  const json = JSON.stringify(JSON.parse(data));
  const existing = await db.get('SELECT * FROM schedules WHERE ownerType = ? AND ownerId = ?', [ownerType, ownerId]);
  if (existing) {
    await db.run('UPDATE schedules SET data = ? WHERE id = ?', [json, existing.id]);
  } else {
    await db.run('INSERT INTO schedules (ownerType, ownerId, data) VALUES (?,?,?)', [ownerType, ownerId, json]);
  }
  res.redirect('/admin');
});

module.exports = router;
