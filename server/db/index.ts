// HYROX Advance Database Connection
// SQLite + Drizzle ORM (using sql.js)

import { drizzle, SQLJsDatabase } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js/dist/sql-wasm.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as schema from './schema.js';
import { sql } from 'drizzle-orm';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库文件路径
const DB_PATH = join(__dirname, '../../data/hyrox.db');
const DATA_DIR = dirname(DB_PATH);

// 全局数据库连接实例
let db: SQLJsDatabase<typeof schema> | null = null;
let sqliteDb: any = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// 保存数据库到文件
function saveDatabase() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// 初始化数据库连接
async function initDatabaseConnection(): Promise<void> {
  if (db) return;
  
  // 确保 data 目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // 初始化 sql.js
  const SQL = await initSqlJs();
  
  // 尝试加载现有数据库
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqliteDb = new SQL.Database(fileBuffer);
  } else {
    sqliteDb = new SQL.Database();
  }
  
  // 创建 Drizzle ORM 实例
  db = drizzle(sqliteDb, { schema });
  
  console.log('✅ Database connected:', DB_PATH);
  console.log('🚀 Using sql.js (pure JavaScript SQLite)');
}

// 同步获取数据库实例（需要在初始化后调用）
export function getDatabase(): SQLJsDatabase<typeof schema> {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// 初始化数据库（创建表）- 只执行一次
export async function initializeDatabase(): Promise<boolean> {
  // 如果已经初始化，直接返回
  if (isInitialized) {
    return true;
  }
  
  // 如果正在初始化，等待完成
  if (initPromise) {
    await initPromise;
    return true;
  }
  
  initPromise = initDatabaseConnection();
  await initPromise;
  
  const database = getDatabase();
  
  try {
    // 创建表（如果不存在）
    database.run(sql`
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
    
    database.run(sql`
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
        sled_pull INTEGER,
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
    
    database.run(sql`
      CREATE TABLE IF NOT EXISTS analysis_reports (
        id TEXT PRIMARY KEY,
        result_id TEXT REFERENCES results(id),
        athlete_id TEXT NOT NULL REFERENCES athletes(id),
        overall_score INTEGER,
        level TEXT,
        weaknesses TEXT,
        strengths TEXT,
        pacing_analysis TEXT,
        fitness_profile TEXT,
        recommendations TEXT,
        ai_summary TEXT,
        energy_system_analysis TEXT,
        muscle_fatigue_analysis TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    
    database.run(sql`
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
    
    database.run(sql`
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
    
    database.run(sql`
      CREATE TABLE IF NOT EXISTS scrape_cache (
        url TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `);
    
    // 为已有数据库添加进阶分析列（若表已存在且无该列）
    try {
      database.run(sql`ALTER TABLE analysis_reports ADD COLUMN energy_system_analysis TEXT`);
    } catch (_) { /* column may already exist */ }
    try {
      database.run(sql`ALTER TABLE analysis_reports ADD COLUMN muscle_fatigue_analysis TEXT`);
    } catch (_) { /* column may already exist */ }

    // 与 Drizzle schema 对齐：旧库缺少 Station 3 (Sled Pull)
    try {
      database.run(sql`ALTER TABLE results ADD COLUMN sled_pull INTEGER`);
    } catch (_) { /* column may already exist */ }
    
    // 创建索引（优化查询性能）
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_results_athlete ON results(athlete_id)`);
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_results_date ON results(race_date)`);
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_results_total_time ON results(total_time)`);
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_results_athlete_race ON results(athlete_id, race_date)`);
    
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_analysis_result ON analysis_reports(result_id)`);
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_analysis_athlete ON analysis_reports(athlete_id)`);
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_analysis_created ON analysis_reports(created_at)`);
    
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_plans_athlete ON training_plans(athlete_id)`);
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_plans_status ON training_plans(status)`);
    
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_logs_plan ON training_logs(plan_id)`);
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_logs_athlete ON training_logs(athlete_id)`);
    database.run(sql`CREATE INDEX IF NOT EXISTS idx_logs_completed ON training_logs(completed_at)`);
    
    // 保存数据库
    saveDatabase();
    
    console.log('✅ Database indexes created (12 indexes for optimal performance)');
    console.log('✅ Database tables created successfully');
    
    isInitialized = true;
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// 关闭数据库连接
export function closeDatabase() {
  if (sqliteDb) {
    try {
      // 保存数据库
      saveDatabase();
      sqliteDb.close();
      console.log('🔒 Database connection closed');
    } catch (err) {
      console.warn('Warning: Could not close database connection:', err);
    }
    db = null;
    sqliteDb = null;
    isInitialized = false;
    initPromise = null;
  }
}

// 导出保存函数，供其他模块使用
export { saveDatabase };

export { db };
export default getDatabase;
