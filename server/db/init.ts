// HYROX Database Initialization Script
// Usage: npm run db:init or tsx server/db/init.ts

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import initSqlJs from 'sql.js/dist/sql-wasm.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../data/hyrox.db');
const BACKUP_DIR = join(__dirname, '../../data/backups');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory');
}

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('📁 Created backup directory');
}

async function initDatabase() {
  console.log('🔧 Initializing HYROX Database...');
  console.log(`📂 Database path: ${DB_PATH}`);

  // Initialize sql.js
  const SQL = await initSqlJs();
  let db: any;

  // Backup existing database if it exists
  if (fs.existsSync(DB_PATH)) {
    const backupName = `hyrox_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
    const backupPath = join(BACKUP_DIR, backupName);
    
    try {
      fs.copyFileSync(DB_PATH, backupPath);
      console.log(`💾 Backed up existing database to: ${backupPath}`);
      
      // Load existing database
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('⚠️ Could not backup existing database:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Create tables
  try {
    // Athletes table
    db.run(`
      CREATE TABLE IF NOT EXISTS athletes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
        age INTEGER,
        weight REAL,
        height REAL,
        experience_level TEXT DEFAULT 'none' CHECK(experience_level IN ('none', 'beginner', 'intermediate', 'advanced', 'elite')),
        target_time INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ Table created: athletes');

    // Results table
    db.run(`
      CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
        race_name TEXT NOT NULL,
        race_date TEXT NOT NULL,
        race_location TEXT,
        division TEXT,
        total_time INTEGER NOT NULL,
        overall_rank INTEGER,
        age_group_rank INTEGER,
        gender_rank INTEGER,
        run_1 INTEGER,
        ski_erg INTEGER,
        run_2 INTEGER,
        sled_push INTEGER,
        run_3 INTEGER,
        burpee_broad_jump INTEGER,
        run_4 INTEGER,
        rowing INTEGER,
        run_5 INTEGER,
        farmers_carry INTEGER,
        run_6 INTEGER,
        sandbag_lunges INTEGER,
        run_7 INTEGER,
        wall_balls INTEGER,
        run_8 INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ Table created: results');

    // Analysis reports table
    db.run(`
      CREATE TABLE IF NOT EXISTS analysis_reports (
        id TEXT PRIMARY KEY,
        result_id TEXT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
        overall_score INTEGER CHECK(overall_score >= 0 AND overall_score <= 100),
        level TEXT CHECK(level IN ('beginner', 'intermediate', 'advanced', 'elite')),
        weaknesses TEXT,
        strengths TEXT,
        pacing_analysis TEXT,
        fitness_profile TEXT,
        recommendations TEXT,
        ai_summary TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ Table created: analysis_reports');

    // Training plans table
    db.run(`
      CREATE TABLE IF NOT EXISTS training_plans (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
        result_id TEXT REFERENCES results(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        duration INTEGER NOT NULL,
        goal TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('beginner', 'improvement', 'advanced')),
        weeks TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
        start_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ Table created: training_plans');

    // Training logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS training_logs (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
        week_number INTEGER NOT NULL,
        day_number INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        exercises TEXT,
        duration INTEGER,
        intensity TEXT CHECK(intensity IN ('low', 'medium', 'high')),
        notes TEXT,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        completed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ Table created: training_logs');

    // Create indexes for performance
    const indexes = [
      { name: 'idx_results_athlete', sql: 'CREATE INDEX IF NOT EXISTS idx_results_athlete ON results(athlete_id)' },
      { name: 'idx_results_date', sql: 'CREATE INDEX IF NOT EXISTS idx_results_date ON results(race_date)' },
      { name: 'idx_results_total_time', sql: 'CREATE INDEX IF NOT EXISTS idx_results_total_time ON results(total_time)' },
      { name: 'idx_results_athlete_race', sql: 'CREATE INDEX IF NOT EXISTS idx_results_athlete_race ON results(athlete_id, race_date)' },
      { name: 'idx_analysis_result', sql: 'CREATE INDEX IF NOT EXISTS idx_analysis_result ON analysis_reports(result_id)' },
      { name: 'idx_analysis_athlete', sql: 'CREATE INDEX IF NOT EXISTS idx_analysis_athlete ON analysis_reports(athlete_id)' },
      { name: 'idx_analysis_created', sql: 'CREATE INDEX IF NOT EXISTS idx_analysis_created ON analysis_reports(created_at)' },
      { name: 'idx_plans_athlete', sql: 'CREATE INDEX IF NOT EXISTS idx_plans_athlete ON training_plans(athlete_id)' },
      { name: 'idx_plans_status', sql: 'CREATE INDEX IF NOT EXISTS idx_plans_status ON training_plans(status)' },
      { name: 'idx_logs_plan', sql: 'CREATE INDEX IF NOT EXISTS idx_logs_plan ON training_logs(plan_id)' },
      { name: 'idx_logs_athlete', sql: 'CREATE INDEX IF NOT EXISTS idx_logs_athlete ON training_logs(athlete_id)' },
      { name: 'idx_logs_completed', sql: 'CREATE INDEX IF NOT EXISTS idx_logs_completed ON training_logs(completed_at)' },
      { name: 'idx_athletes_email', sql: 'CREATE INDEX IF NOT EXISTS idx_athletes_email ON athletes(email)' },
    ];

    for (const idx of indexes) {
      db.run(idx.sql);
      console.log(`✅ Index created: ${idx.name}`);
    }

    // Get table statistics
    const athleteCount = db.exec("SELECT COUNT(*) as count FROM athletes")[0]?.values[0]?.[0] || 0;
    const resultCount = db.exec("SELECT COUNT(*) as count FROM results")[0]?.values[0]?.[0] || 0;
    const analysisCount = db.exec("SELECT COUNT(*) as count FROM analysis_reports")[0]?.values[0]?.[0] || 0;
    const planCount = db.exec("SELECT COUNT(*) as count FROM training_plans")[0]?.values[0]?.[0] || 0;

    console.log('\n📊 Database Statistics:');
    console.log(`   Athletes: ${athleteCount}`);
    console.log(`   Results: ${resultCount}`);
    console.log(`   Analysis Reports: ${analysisCount}`);
    console.log(`   Training Plans: ${planCount}`);

    // Save database to file
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    console.log('\n✅ Database initialization completed successfully!');
    console.log(`📂 Database file: ${DB_PATH}`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (db) {
      db.close();
    }
  }
}

initDatabase();
