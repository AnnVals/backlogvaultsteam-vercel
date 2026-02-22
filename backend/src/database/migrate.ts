import { pool } from '../config/database';

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        steam_id VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        rawg_id INTEGER UNIQUE,
        steam_appid INTEGER UNIQUE,
        title VARCHAR(500) NOT NULL,
        cover_url VARCHAR(1000),
        background_url VARCHAR(1000),
        release_date DATE,
        genres TEXT[],
        platforms TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TYPE game_status AS ENUM ('playing','completed','wishlist','dropped','backlog');
    `);

    await client.query(`
      CREATE TYPE game_source AS ENUM ('manual','steam','epic_free','gog','csv');
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_library (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        platform VARCHAR(100) NOT NULL,
        status game_status NULL,
        source game_source DEFAULT 'manual',
        hours_played INTEGER DEFAULT 0,
        rating SMALLINT CHECK (rating BETWEEN 1 AND 10),
        notes TEXT,
        external_id VARCHAR(100),
        added_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, game_id, platform)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS import_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        service VARCHAR(50) NOT NULL,
        games_found INTEGER,
        games_imported INTEGER,
        games_skipped INTEGER,
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_library_user ON user_library(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_library_status ON user_library(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_library_source ON user_library(source);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_games_steam ON games(steam_appid);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_games_rawg ON games(rawg_id);`);

    await client.query('COMMIT');
    console.log('Migration complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();