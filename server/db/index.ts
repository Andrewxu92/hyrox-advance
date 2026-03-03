// HYROX Advance Database Connection
// SQLite + Drizzle ORM

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as schema from './schema.js';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库文件路径
const DB_PATH = join(__dirname, '../../data/hyrox.db');

// 创建数据库连接
let db: ReturnType<typeof drizzle<typeof schema>>;

export function getDatabase() {
  if (!db) {
    // 创建 SQLite 数据库
    const sqlite = new Database(DB_PATH);
    
    // 启用外键约束
    sqlite.pragma('foreign_keys = ON');
    
    // 创建 Drizzle ORM 实例
    db = drizzle(sqlite, { schema });
    
    console.log('✅ Database connected:', DB_PATH);
  }
  
  return db;
}

// 初始化数据库（创建表）
export async function initializeDatabase() {
  const database = getDatabase();
  
  try {
    // 创建表（如果不存在）
    await database.run(sql`
      CREATE TABLE IF NOT EXISTS athletes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        gender TEXT NOT NULL,
        age INTEGER,
        weight REAL,
        height REAL,
        experience_level TEXT DEFAULT 'none',
        target_time INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    
    await database.run(sql`
      CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES athletes(id),
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
    
    await database.run(sql`
      CREATE TABLE IF NOT EXISTS analysis_reports (
        id TEXT PRIMARY KEY,
        result_id TEXT NOT NULL REFERENCES results(id),
        athlete_id TEXT NOT NULL REFERENCES athletes(id),
        overall_score INTEGER,
        level TEXT,
        weaknesses TEXT,
        strengths TEXT,
        pacing_analysis TEXT,
        fitness_profile TEXT,
        recommendations TEXT,
        ai_summary TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    
    await database.run(sql`
      CREATE TABLE IF NOT EXISTS training_plans (
        id TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES athletes(id),
        result_id TEXT REFERENCES results(id),
        name TEXT NOT NULL,
        duration INTEGER NOT NULL,
        goal TEXT NOT NULL,
        type TEXT NOT NULL,
        weeks TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        start_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    
    await database.run(sql`
      CREATE TABLE IF NOT EXISTS training_logs (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL REFERENCES training_plans(id),
        athlete_id TEXT NOT NULL REFERENCES athletes(id),
        week_number INTEGER NOT NULL,
        day_number INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        exercises TEXT,
        duration INTEGER,
        intensity TEXT,
        notes TEXT,
        rating INTEGER,
        completed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    
    // 创建索引
    await database.run(sql`CREATE INDEX IF NOT EXISTS idx_results_athlete ON results(athlete_id)`);
    await database.run(sql`CREATE INDEX IF NOT EXISTS idx_analysis_result ON analysis_reports(result_id)`);
    await database.run(sql`CREATE INDEX IF NOT EXISTS idx_analysis_athlete ON analysis_reports(athlete_id)`);
    await database.run(sql`CREATE INDEX IF NOT EXISTS idx_plans_athlete ON training_plans(athlete_id)`);
    await database.run(sql`CREATE INDEX IF NOT EXISTS idx_logs_plan ON training_logs(plan_id)`);
    
    console.log('✅ Database tables created successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// 关闭数据库连接
export function closeDatabase() {
  if (db) {
    const sqlite = (db as any).client;
    if (sqlite) {
      sqlite.close();
      console.log('🔒 Database connection closed');
    }
  }
}

export { db };
export default getDatabase;
