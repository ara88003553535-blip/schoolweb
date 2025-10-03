const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const fs = require('fs');

const db = require('./db');
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const scheduleRoutes = require('./routes/schedule');
const adminRoutes = require('./routes/admin');
const { ensureAuthenticated, attachUser } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: './data' }),
  secret: 'replace-with-a-secure-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
}));

// Session inactivity timeout middleware
const INACTIVITY_TIMEOUT_MS = 1000 * 60 * 30; // 30 minutes
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    const last = req.session.lastActivity || 0;
    const now = Date.now();
    if (now - last > INACTIVITY_TIMEOUT_MS) {
      // destroy session and force re-login
      req.session.destroy(err => {
        if (err) console.error('Session destroy error:', err);
        return res.redirect('/login?timeout=1');
      });
      return;
    }
    req.session.lastActivity = now;
  }
  next();
});

// Attach current user to res.locals for templates
app.use(attachUser);

app.get('/', async (req, res) => {
  // show changes for today per class
  const today = new Date().toISOString().slice(0, 10);
  const changes = await db.all(`SELECT classes.name as className, changes.description
    FROM changes JOIN classes ON changes.classId = classes.id WHERE changes.date = ?`, [today]);
  const classes = await db.all('SELECT id, name FROM classes');
  res.render('index', { user: req.user || null, changes, classes });
});

app.use('/', authRoutes);
app.use('/news', newsRoutes);
app.use('/schedule', scheduleRoutes);
app.use('/admin', adminRoutes);

// simple 404
app.use((req, res) => res.status(404).send('Not found'));

// initialize DB and start
(async () => {
  await db.init();
  app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
})();
