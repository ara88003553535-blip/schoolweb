const db = require('../db');

async function attachUser(req, res, next) {
  if (req.session && req.session.userId) {
    const user = await db.get('SELECT id, name, email, role, classId FROM users WHERE id = ?', [req.session.userId]);
    req.user = user || null;
    res.locals.user = user || null;
  } else {
    req.user = null;
    res.locals.user = null;
  }
  next();
}

function ensureAuthenticated(req, res, next) {
  if (req.user) return next();
  res.redirect('/login');
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(403).send('Forbidden');
    if (req.user.role === role || req.user.role === 'admin') return next();
    return res.status(403).send('Forbidden');
  };
}

module.exports = { attachUser, ensureAuthenticated, requireRole };
