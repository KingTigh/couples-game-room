-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game history table
CREATE TABLE IF NOT EXISTS game_history (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL,
    opponent_name VARCHAR(255),
    opponent_id VARCHAR(255),
    my_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    result VARCHAR(10) CHECK (result IN ('win', 'loss', 'draw')),
    played_at BIGINT NOT NULL,
    room_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_played_at ON game_history(played_at);