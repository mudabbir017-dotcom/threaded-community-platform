const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'community_feed.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDb() {
  const database = getDb();
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  database.exec(schema);
  console.log('✅ Database initialized with schema');
  return database;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initializeDb, closeDb };
