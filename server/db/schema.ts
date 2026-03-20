// HYROX Advance Database Schema
// SQLite + Drizzle ORM

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================
// 运动员表
// ============================================
export const athletes = sqliteTable('athletes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  gender: text('gender', { enum: ['male', 'female'] }).notNull(),
  age: integer('age'),
  weight: real('weight'), // kg
  height: real('height'), // cm
  
  // HYROX 相关信息
  experienceLevel: text('experience_level', { 
    enum: ['none', 'beginner', 'intermediate', 'advanced', 'elite'] 
  }).default('none'),
  targetTime: integer('target_time'), // 目标完赛时间（秒）
  
  // 时间戳
  createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString()),
});

// ============================================
// 比赛成绩表
// ============================================
export const results = sqliteTable('results', {
  id: text('id').primaryKey(),
  athleteId: text('athlete_id').notNull().references(() => athletes.id),
  
  // 比赛信息
  raceName: text('race_name').notNull(),
  raceDate: text('race_date').notNull(),
  raceLocation: text('race_location'),
  division: text('division'), // 组别（Pro/Open/Relay 等）
  
  // 总体成绩
  totalTime: integer('total_time').notNull(), // 秒
  overallRank: integer('overall_rank'),
  ageGroupRank: integer('age_group_rank'),
  genderRank: integer('gender_rank'),
  
  // 分段成绩（8 轮跑步 + 8 个 station）- 修正为官方HYROX标准顺序
  run1: integer('run_1'),
  skiErg: integer('ski_erg'),              // Station 1: 1000m SkiErg
  run2: integer('run_2'),
  sledPush: integer('sled_push'),          // Station 2: 50m Sled Push
  run3: integer('run_3'),
  sledPull: integer('sled_pull'),          // Station 3: 50m Sled Pull (新增)
  run4: integer('run_4'),
  burpeeBroadJump: integer('burpee_broad_jump'), // Station 4: 80m Burpee Broad Jump
  run5: integer('run_5'),
  rowing: integer('rowing'),               // Station 5: 1000m Rowing
  run6: integer('run_6'),
  farmersCarry: integer('farmers_carry'),  // Station 6: 200m Farmer's Carry
  run7: integer('run_7'),
  sandbagLunges: integer('sandbag_lunges'), // Station 7: 100m Sandbag Lunges
  run8: integer('run_8'),
  wallBalls: integer('wall_balls'),        // Station 8: 100 reps Wall Balls
  
  // 元数据
  notes: text('notes'),
  createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString()),
}, (table) => ({
  // 索引优化
  athleteIdIdx: index('athlete_id_idx').on(table.athleteId),
  raceDateIdx: index('race_date_idx').on(table.raceDate),
  totalTimeIdx: index('total_time_idx').on(table.totalTime),
  athleteRaceIdx: index('athlete_race_idx').on(table.athleteId, table.raceDate),
}));

// ============================================
// AI 分析报告表
// ============================================
export const analysisReports = sqliteTable('analysis_reports', {
  id: text('id').primaryKey(),
  resultId: text('result_id').references(() => results.id),
  athleteId: text('athlete_id').notNull().references(() => athletes.id),
  
  // 总体评估
  overallScore: integer('overall_score'), // 0-100
  level: text('level', { 
    enum: ['beginner', 'intermediate', 'advanced', 'elite'] 
  }),
  
  // 弱项分析（JSON 格式）
  weaknesses: text('weaknesses'), // JSON string
  
  // 强项分析（JSON 格式）
  strengths: text('strengths'), // JSON string
  
  // 跑步配速分析（JSON 格式）
  pacingAnalysis: text('pacing_analysis'), // JSON string
  
  // 体能评估（JSON 格式）
  fitnessProfile: text('fitness_profile'), // JSON string
  
  // 改进建议（JSON 格式）
  recommendations: text('recommendations'), // JSON string
  
  // AI 生成内容
  aiSummary: text('ai_summary'),
  
  // 进阶分析（JSON 格式）
  energySystemAnalysis: text('energy_system_analysis'),
  muscleFatigueAnalysis: text('muscle_fatigue_analysis'),
  
  // 时间戳
  createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
});

// ============================================
// 训练计划表
// ============================================
export const trainingPlans = sqliteTable('training_plans', {
  id: text('id').primaryKey(),
  athleteId: text('athlete_id').notNull().references(() => athletes.id),
  resultId: text('result_id').references(() => results.id), // 基于哪个成绩生成
  
  // 计划信息
  name: text('name').notNull(),
  duration: integer('duration').notNull(), // 周数
  goal: text('goal').notNull(), // 目标描述
  type: text('type', { 
    enum: ['beginner', 'improvement', 'advanced'] 
  }).notNull(),
  
  // 计划内容（JSON 格式）
  weeks: text('weeks').notNull(), // JSON string
  
  // 状态
  status: text('status', { 
    enum: ['active', 'completed', 'paused'] 
  }).default('active'),
  
  // 时间戳
  startDate: text('start_date'),
  createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
});

// ============================================
// 训练打卡记录表
// ============================================
export const trainingLogs = sqliteTable('training_logs', {
  id: text('id').primaryKey(),
  planId: text('plan_id').notNull().references(() => trainingPlans.id),
  athleteId: text('athlete_id').notNull().references(() => athletes.id),
  
  // 训练信息
  weekNumber: integer('week_number').notNull(),
  dayNumber: integer('day_number').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  
  // 训练内容
  exercises: text('exercises'), // JSON string
  
  // 反馈
  duration: integer('duration'), // 实际时长（分钟）
  intensity: text('intensity', { 
    enum: ['low', 'medium', 'high'] 
  }),
  notes: text('notes'),
  rating: integer('rating'), // 1-5 分
  
  // 时间戳
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
});

// 导出类型
export type Athlete = typeof athletes.$inferSelect;
export type NewAthlete = typeof athletes.$inferInsert;
export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;
export type AnalysisReport = typeof analysisReports.$inferSelect;
export type NewAnalysisReport = typeof analysisReports.$inferInsert;
export type TrainingPlan = typeof trainingPlans.$inferSelect;
export type NewTrainingPlan = typeof trainingPlans.$inferInsert;
export type TrainingLog = typeof trainingLogs.$inferSelect;
export type NewTrainingLog = typeof trainingLogs.$inferInsert;
