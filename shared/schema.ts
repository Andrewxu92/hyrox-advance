// HYROX 成绩数据结构

export interface HyroxResult {
  id: string;
  userId: string;
  
  // 比赛信息
  raceName: string;
  raceDate: string;
  raceLocation: string;
  
  // 选手信息
  athleteName: string;
  gender: 'male' | 'female';
  ageGroup: string; // 16-24, 25-29, 30-34, etc.
  weight?: number;
  
  // 总体成绩
  totalTime: number; // 秒
  overallRank?: number;
  ageGroupRank?: number;
  
  // 分段成绩（8轮跑步 + 8个station）
  splits: {
    // Run 1
    run1: number;
    // Station 1: SkiErg
    skiErg: number;
    // Run 2
    run2: number;
    // Station 2: Sled Push
    sledPush: number;
    // Run 3
    run3: number;
    // Station 3: Burpee Broad Jump
    burpeeBroadJump: number;
    // Run 4
    run4: number;
    // Station 4: Rowing
    rowing: number;
    // Run 5
    run5: number;
    // Station 5: Farmer's Carry
    farmersCarry: number;
    // Run 6
    run6: number;
    // Station 6: Sandbag Lunges
    sandbagLunges: number;
    // Run 7
    run7: number;
    // Station 7: Wall Balls
    wallBalls: number;
    // Run 8
    run8: number;
  };
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
}

// AI分析报告
export interface AnalysisReport {
  id: string;
  resultId: string;
  userId: string;
  
  // 总体评估
  overallScore: number; // 0-100
  level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  
  // 弱项分析
  weaknesses: {
    station: string;
    time: number;
    percentile: number; // 同水平组百分位
    gap: number; // 与平均水平差距（秒）
  }[];
  
  // 强项分析
  strengths: {
    station: string;
    time: number;
    percentile: number;
  }[];
  
  // 跑步配速分析
  pacingAnalysis: {
    runNumber: number;
    time: number;
    vsFirstRun: number; // 与第一轮差距
    trend: 'fast' | 'steady' | 'slowing';
  }[];
  
  // 体能评估
  fitnessProfile: {
    strength: number; // 0-100
    endurance: number;
    speed: number;
    transition: number; // 转换能力
  };
  
  // 改进建议
  recommendations: {
    priority: number;
    area: string;
    suggestion: string;
    expectedImprovement: string;
  }[];
  
  // AI生成内容
  aiSummary: string;
  
  createdAt: Date;
}

// 训练计划
export interface TrainingPlan {
  id: string;
  userId: string;
  resultId?: string; // 基于哪个成绩生成
  
  // 计划信息
  name: string;
  duration: number; // 周数
  goal: string; // 目标描述
  
  // 计划内容
  weeks: TrainingWeek[];
  
  // 计划类型
  type: 'beginner' | 'improvement' | 'advanced';
  
  createdAt: Date;
}

export interface TrainingWeek {
  weekNumber: number;
  focus: string; // 本周重点
  days: TrainingDay[];
}

export interface TrainingDay {
  dayNumber: number;
  type: 'rest' | 'skill' | 'strength' | 'endurance' | 'combined' | 'mock';
  title: string;
  description: string;
  exercises: Exercise[];
  duration: number; // 预计时长（分钟）
  intensity: 'low' | 'medium' | 'high';
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number; // 秒或分钟
  rest?: number; // 休息时间（秒）
  notes?: string;
}

// 用户
export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  gender?: 'male' | 'female';
  age?: number;
  weight?: number;
  height?: number;
  
  // HYROX相关信息
  experienceLevel?: 'none' | 'beginner' | 'intermediate' | 'advanced';
  targetTime?: number; // 目标完赛时间（秒）
  
  // 账户信息
  plan: 'free' | 'basic' | 'pro';
  planExpiry?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
