// HYROX Database Initialization Script
// Usage: npm run db:init or tsx server/db/init.ts

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
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

console.log('🔧 Initializing HYROX Database...');
console.log(`📂 Database path: ${DB_PATH}`);

// Backup existing database if it exists
if (fs.existsSync(DB_PATH)) {
  const backupName = `hyrox_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  const backupPath = join(BACKUP_DIR, backupName);
  
  try {
    // Use SQLite's backup command for safe copying
    const tempDb = new Database(DB_PATH);
    tempDb.backup(backupPath);
    tempDb.close();
    console.log(`💾 Backed up existing database to: ${backupPath}`);
  } catch (err) {
    console.warn('⚠️ Could not backup existing database:', err);
  }
}

// Create new database connection
const db = new Database(DB_PATH);

// Enable performance optimizations
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');

console.log('✅ Database optimizations enabled');

// Create tables
try {
  // Athletes table
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
    db.exec(idx.sql);
    console.log(`✅ Index created: ${idx.name}`);
  }

  // Create triggers for updated_at
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_athletes_timestamp 
    AFTER UPDATE ON athletes
    BEGIN
      UPDATE athletes SET updated_at = datetime('now') WHERE id = NEW.id;
    END
  `);
  console.log('✅ Trigger created: update_athletes_timestamp');

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_results_timestamp 
    AFTER UPDATE ON results
    BEGIN
      UPDATE results SET updated_at = datetime('now') WHERE id = NEW.id;
    END
  `);
  console.log('✅ Trigger created: update_results_timestamp');

  // Insert sample data if tables are empty
  const athleteCount = db.prepare('SELECT COUNT(*) as count FROM athletes').get() as { count: number };
  
  if (athleteCount.count === 0) {
    console.log('📝 Inserting sample data...');
    
    // Sample athlete
    const sampleAthleteId = 'sample-athlete-001';
    db.prepare(`
      INSERT INTO athletes (id, name, email, gender, age, weight, height, experience_level, target_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sampleAthleteId,
      'Demo Athlete',
      'demo@hyrox-advance.com',
      'male',
      30,
      75.5,
      180,
      'intermediate',
      3600
    );
    console.log('✅ Sample athlete created');

    // Sample result
    const sampleResultId = 'sample-result-001';
    db.prepare(`
      INSERT INTO results (
        id, athlete_id, race_name, race_date, race_location, division, total_time,
        overall_rank, age_group_rank, gender_rank,
        run_1, ski_erg, run_2, sled_push, run_3, burpee_broad_jump, run_4, rowing,
        run_5, farmers_carry, run_6, sandbag_lunges, run_7, wall_balls, run_8
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sampleResultId,
      sampleAthleteId,
      'HYROX Shanghai 2024',
      '2024-03-15',
      'Shanghai',
      'Open',
      4500,
      150,
      25,
      120,
      300, 180, 320, 200, 330, 210, 340, 190,
      350, 220, 360, 230, 370, 200, 380
    );
    console.log('✅ Sample result created');

    // Sample analysis report
    db.prepare(`
      INSERT INTO analysis_reports (
        id, result_id, athlete_id, overall_score, level, weaknesses, strengths,
        pacing_analysis, fitness_profile, recommendations, ai_summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'sample-analysis-001',
      sampleResultId,
      sampleAthleteId,
      75,
      'intermediate',
      JSON.stringify(['sled_push', 'wall_balls']),
      JSON.stringify(['ski_erg', 'rowing']),
      JSON.stringify({ firstRun: 300, lastRun: 380, degradation: 80, consistency: 'moderate' }),
      JSON.stringify({ aerobic: 75, strength: 70, power: 72, endurance: 78 }),
      JSON.stringify(['Focus on sled push technique', 'Increase wall ball volume', 'Maintain cardio base']),
      'Overall solid intermediate performance with room for improvement in strength stations.'
    );
    console.log('✅ Sample analysis report created');
  }

  // Get table statistics
  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM athletes) as athlete_count,
      (SELECT COUNT(*) FROM results) as result_count,
      (SELECT COUNT(*) FROM analysis_reports) as analysis_count,
      (SELECT COUNT(*) FROM training_plans) as plan_count
  `).get();

  console.log('\n📊 Database Statistics:');
  console.log(`   Athletes: ${stats.athlete_count}`);
  console.log(`   Results: ${stats.result_count}`);
  console.log(`   Analysis Reports: ${stats.analysis_count}`);
  console.log(`   Training Plans: ${stats.plan_count}`);

  console.log('\n✅ Database initialization completed successfully!');
  console.log(`📂 Database file: ${DB_PATH}`);

} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
} finally {
  db.close();
}
