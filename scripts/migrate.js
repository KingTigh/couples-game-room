require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const schema = fs.readFileSync(path.join(__dirname, '../lib/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Migration successful! Tables created.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

migrate();