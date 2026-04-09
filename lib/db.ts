import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export interface User {
  id: string;
  username: string;
  password: string;
  created_at?: Date;
}

export interface GameHistory {
  id: string;
  user_id: string;
  game_type: string;
  opponent_name: string;
  opponent_id?: string;
  my_score: number;
  opponent_score: number;
  result: 'win' | 'loss' | 'draw';
  played_at: number;
  room_code: string;
  created_at?: Date;
}

export const db = {
  async getUser(username: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  },

  async getUserById(id: string): Promise<User | null> {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async createUser(user: User): Promise<User> {
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO users (id, username, password) VALUES ($1, $2, $3) RETURNING *',
      [user.id, user.username, user.password]
    );
    return result.rows[0];
  },

  async getGameHistory(userId: string): Promise<GameHistory[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM game_history WHERE user_id = $1 ORDER BY played_at DESC',
      [userId]
    );
    return result.rows;
  },

  async addGameHistory(game: GameHistory): Promise<GameHistory> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO game_history 
       (id, user_id, game_type, opponent_name, opponent_id, my_score, opponent_score, result, played_at, room_code) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        game.id,
        game.user_id,
        game.game_type,
        game.opponent_name,
        game.opponent_id,
        game.my_score,
        game.opponent_score,
        game.result,
        game.played_at,
        game.room_code,
      ]
    );
    return result.rows[0];
  },
};