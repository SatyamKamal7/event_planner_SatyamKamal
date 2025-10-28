const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Additional options for better connection handling
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // how long to wait for a connection
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to Neon.tech PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Helper function to test connection
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Database connection test successful');
    console.log('📊 PostgreSQL Version:', result.rows[0].version);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.log('💡 Please check:');
    console.log('   - Your DATABASE_URL in .env file');
    console.log('   - Your Neon.tech database is running');
    console.log('   - Your IP is allowed in Neon.tech network settings');
    return false;
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection
};