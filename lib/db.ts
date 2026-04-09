import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

interface Database {
  users: any[];
  gameHistory: any[];
}

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Read database
export const readDB = (): Database => {
  ensureDataDir();
  
  if (!fs.existsSync(DB_PATH)) {
    const initialDB: Database = { users: [], gameHistory: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

// Write database
export const writeDB = (db: Database) => {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
};

// User operations
export const findUserByEmail = (email: string) => {
  const db = readDB();
  return db.users.find(u => u.email === email);
};

export const findUserById = (id: string) => {
  const db = readDB();
  return db.users.find(u => u.id === id);
};

export const createUser = (user: any) => {
  const db = readDB();
  db.users.push(user);
  writeDB(db);
  return user;
};

// Game history operations
export const addGameHistory = (game: any) => {
  const db = readDB();
  db.gameHistory.push(game);
  writeDB(db);
  return game;
};

export const getUserGameHistory = (userId: string) => {
  const db = readDB();
  return db.gameHistory.filter(g => g.userId === userId);
};