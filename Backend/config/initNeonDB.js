const { Pool } = require('pg');
require('dotenv').config();

async function initializeNeonDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to Neon.tech database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to Neon.tech successfully');

    // Create tables
    console.log('🗃️ Creating database tables...');
    
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Events table
      CREATE TABLE IF NOT EXISTS events (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          location VARCHAR(500) NOT NULL,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- RSVPs table
      CREATE TABLE IF NOT EXISTS rsvps (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          event_id INTEGER REFERENCES events(id),
          status VARCHAR(50) CHECK (status IN ('going', 'maybe', 'decline')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, event_id)
      );
    `);

    console.log('✅ All tables created successfully');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
      CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id);
      CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    console.log('✅ Indexes created successfully');

    client.release();

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeNeonDatabase()
    .then(() => {
      console.log('🎉 Neon.tech database initialization completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Neon.tech database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initializeNeonDatabase;