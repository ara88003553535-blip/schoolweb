const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const fs = require('fs');

const DB_FILE = './data/app.sqlite';

let dbInstance;

async function init() {
  if (!fs.existsSync('./data')) fs.mkdirSync('./data');
  dbInstance = await open({ filename: DB_FILE, driver: sqlite3.Database });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'guest',
      classId INTEGER
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      body TEXT,
      authorId INTEGER,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      newsId INTEGER,
      userId INTEGER,
      body TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      newsId INTEGER,
      userId INTEGER,
      value INTEGER
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ownerType TEXT,
      ownerId INTEGER,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS bells (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT,
      label TEXT
    );

    CREATE TABLE IF NOT EXISTS changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      classId INTEGER,
      date TEXT,
      description TEXT
    );
  `);

  // seed default classes
  const classes = await dbInstance.all('SELECT * FROM classes');
  if (classes.length === 0) {
    await dbInstance.run('INSERT INTO classes (name) VALUES (?), (?), (?)', ['1A', '2B', '11C']);
  }

  // seed admin user
  const admin = await dbInstance.get('SELECT * FROM users WHERE email = ?', ['admin@school.local']);
  if (!admin) {
    const hash = await bcrypt.hash('adminpass', 10);
    await dbInstance.run('INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)', ['Admin', 'admin@school.local', hash, 'admin']);
    console.log('Seeded admin user: admin@school.local / adminpass');
  }

  // seed sample bell times
  const bells = await dbInstance.all('SELECT * FROM bells');
  if (bells.length === 0) {
    await dbInstance.run("INSERT INTO bells (time, label) VALUES ('08:30', '1 урок'), ('09:20','2 урок'), ('10:10','3 урок')");
  }
}

module.exports = {
  init,
  get db() { return dbInstance; },
  run: (...args) => dbInstance.run(...args),
  get: (...args) => dbInstance.get(...args),
  all: (...args) => dbInstance.all(...args)
};
