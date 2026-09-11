const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('CITIZEN', 'OFFICER', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN')) NOT NULL DEFAULT 'CITIZEN',
        department_id INTEGER REFERENCES departments(id),
        phone TEXT,
        zone TEXT DEFAULT 'Zone 1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS grievance_categories (
        id SERIAL PRIMARY KEY,
        department_id INTEGER REFERENCES departments(id),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        default_priority TEXT CHECK(default_priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
        sla_hours INTEGER DEFAULT 48
      );

      CREATE TABLE IF NOT EXISTS sla_rules (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        sla_hours INTEGER NOT NULL,
        escalation_threshold_hours INTEGER DEFAULT 4,
        UNIQUE(category, priority)
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        incident_number TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        department TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'HIGH',
        status TEXT DEFAULT 'OPEN',
        primary_location TEXT,
        affected_citizens_count INTEGER DEFAULT 1,
        assigned_officer_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS grievances (
        id SERIAL PRIMARY KEY,
        tracking_number TEXT UNIQUE NOT NULL,
        citizen_id INTEGER NOT NULL REFERENCES users(id),
        category TEXT NOT NULL,
        subcategory TEXT,
        department TEXT NOT NULL,
        priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) NOT NULL DEFAULT 'MEDIUM',
        description TEXT NOT NULL,
        location_text TEXT,
        latitude REAL,
        longitude REAL,
        language TEXT DEFAULT 'en',
        status TEXT CHECK(status IN ('SUBMITTED', 'AI_PROCESSED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CITIZEN_VERIFIED', 'CLOSED', 'ESCALATED', 'REOPENED', 'REJECTED')) NOT NULL DEFAULT 'SUBMITTED',
        ai_confidence REAL DEFAULT 0.90,
        assigned_officer_id INTEGER REFERENCES users(id),
        sla_deadline TIMESTAMP,
        is_escalated INTEGER DEFAULT 0,
        escalation_level INTEGER DEFAULT 0,
        incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
        is_duplicate INTEGER DEFAULT 0,
        duplicate_of_id INTEGER REFERENCES grievances(id),
        duplicate_confidence REAL DEFAULT 0.0,
        reopen_count INTEGER DEFAULT 0,
        reopen_reason TEXT,
        resolution_notes TEXT,
        resolved_at TIMESTAMP,
        verified_at TIMESTAMP,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS incident_grievances (
        id SERIAL PRIMARY KEY,
        incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
        grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(incident_id, grievance_id)
      );

      CREATE TABLE IF NOT EXISTS escalations (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
        escalated_from_officer_id INTEGER REFERENCES users(id),
        escalated_to_officer_id INTEGER REFERENCES users(id),
        reason TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_analysis (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id) ON DELETE CASCADE,
        extracted_json TEXT NOT NULL,
        raw_prompt TEXT,
        confidence REAL DEFAULT 0.9,
        missing_info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER UNIQUE REFERENCES grievances(id) ON DELETE CASCADE,
        location_text TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        address TEXT,
        city TEXT,
        state TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS grievance_status_history (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
        previous_status TEXT,
        new_status TEXT NOT NULL,
        changed_by_user_id INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        entity_name TEXT NOT NULL,
        entity_id TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_grievances_citizen ON grievances(citizen_id);
      CREATE INDEX IF NOT EXISTS idx_grievances_tracking ON grievances(tracking_number);
      CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
      CREATE INDEX IF NOT EXISTS idx_grievances_department ON grievances(department);
      CREATE INDEX IF NOT EXISTS idx_grievances_officer ON grievances(assigned_officer_id);
      CREATE INDEX IF NOT EXISTS idx_grievances_incident ON grievances(incident_id);
    `);
    console.log("Full PostgreSQL database schema initialized successfully.");
  } catch (err) {
    console.error("Error initializing DB schema:", err);
  }
}

// Ensure schema is created
initDatabase();

module.exports = {
  initDatabase,
  prepare: (sql) => {
    let i = 1;
    const pgSql = sql.replace(/\?/g, () => `$${i++}`);
    
    return {
      get: async (...params) => {
        const res = await pool.query(pgSql, params.flat());
        return res.rows[0];
      },
      all: async (...params) => {
        const res = await pool.query(pgSql, params.flat());
        return res.rows;
      },
      run: async (...params) => {
        const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
        const finalSql = isInsert ? `${pgSql} RETURNING id` : pgSql;
        const res = await pool.query(finalSql, params.flat());
        return {
          lastInsertRowid: res.rows[0]?.id,
          changes: res.rowCount
        };
      }
    };
  },
  exec: async (sql) => {
    return pool.query(sql);
  }
};
