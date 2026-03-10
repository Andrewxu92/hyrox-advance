// HYROX 进阶分析模块
// 融合运动科学：能量系统分析 + 肌肉群疲劳分析

import type { AnalysisReport } from '../../shared/schema.js';

// ============================================
// 能量系统分析
// ============================================

/**
 * 分析 HYROX 比赛中的能量系统贡献
 * 
 * HYROX 能量系统特点:
 * - ATP-CP 系统：0-10s 爆发力 (Sled Push, Sled Pull, Wall Balls 等爆发动作)
 * - 糖酵解系统：30s-2min 高强度 (每个 Station 的主要供能系统)
 * - 有氧氧化系统：持续耐力 (8 轮跑步的主要供能系统)
 */
export function analyzeEnergySystem(splits: {
  run1: number; skiErg: number; run2: number; sledPush: number;
  run3: number; burpeeBroadJump: number; run4: number; rowing: number;
  run5: number; farmersCarry: number; run6: number; sandbagLunges: number;
  run7: number; wallBalls: number; run8: number;
}): {
  atpCpContribution: number;
  glycolyticContribution: number;
  aerobicContribution: number;
  dominantSystem: 'ATP-CP' | 'Glycolytic' | 'Aerobic';
  analysis: string;
} {
  // 计算各部分时间
  const runningTime = splits.run1 + splits.run2 + splits.run3 + splits.run4 + 
                      splits.run5 + splits.run6 + splits.run7 + splits.run8;
  
  const stationTime = splits.skiErg + splits.sledPush + splits.burpeeBroadJump + 
                      splits.rowing + splits.farmersCarry + splits.sandbagLunges + splits.wallBalls;
  
  const totalTime = runningTime + stationTime;
  
  // 爆发力动作 (ATP-CP 主导): Sled Push, Sled Pull, Wall Balls, Burpee Broad Jump
  const explosiveStationTime = splits.sledPush + splits.wallBalls + splits.burpeeBroadJump;
  
  // 高强度间歇动作 (糖酵解主导): SkiErg, Rowing, Farmers Carry, Sandbag Lunges
  const glycolyticStationTime = splits.skiErg + splits.rowing + splits.farmersCarry + splits.sandbagLunges;
  
  // 计算各系统贡献比例
  // ATP-CP: 爆发力动作占比 + 跑步中的冲刺成分 (约 10%)
  const atpCpScore = (explosiveStationTime / totalTime) * 100 + 10;
  
  // 糖酵解：高强度 Station 占比 + 跑步中的无氧成分 (约 15%)
  const glycolyticScore = (glycolyticStationTime / totalTime) * 100 + 15;
  
  // 有氧：跑步时间占比 (主要供能系统)
  const aerobicScore = (runningTime / totalTime) * 100;
  
  // 归一化到 0-100
  const total = atpCpScore + glycolyticScore + aerobicScore;
  const atpCpContribution = Math.round((atpCpScore / total) * 100);
  const glycolyticContribution = Math.round((glycolyticScore / total) * 100);
  const aerobicContribution = Math.round((aerobicScore / total) * 100);
  
  // 确定主导能量系统
  let dominantSystem: 'ATP-CP' | 'Glycolytic' | 'Aerobic';
  if (atpCpContribution > glycolyticContribution && atpCpContribution > aerobicContribution) {
    dominantSystem = 'ATP-CP';
  } else if (glycolyticContribution > aerobicContribution) {
    dominantSystem = 'Glycolytic';
  } else {
    dominantSystem = 'Aerobic';
  }
  
  // 生成分析文本
  const analysis = generateEnergySystemAnalysis({
    atpCpContribution,
    glycolyticContribution,
    aerobicContribution,
    dominantSystem,
    runningTime,
    stationTime,
    explosiveStationTime,
    glycolyticStationTime
  });
  
  return {
    atpCpContribution,
    glycolyticContribution,
    aerobicContribution,
    dominantSystem,
    analysis
  };
}

function generateEnergySystemAnalysis(data: any): string {
  const { atpCpContribution, glycolyticContribution, aerobicContribution, dominantSystem, runningTime, stationTime } = data;
  
  let analysis = `能量系统分析显示，你的 HYROX 表现主要由${getDominantSystemName(dominantSystem)}主导。\n\n`;
  
  analysis += `• ATP-CP 系统 (爆发力): ${atpCpContribution}% - 负责 Sled Push、Wall Balls 等爆发性动作\n`;
  analysis += `• 糖酵解系统 (高强度): ${glycolyticContribution}% - 负责 SkiErg、Rowing 等高强度间歇\n`;
  analysis += `• 有氧系统 (耐力): ${aerobicContribution}% - 负责 8 轮跑步的持续供能\n\n`;
  
  if (dominantSystem === 'Aerobic') {
    analysis += `💡 建议：你的有氧基础良好，可以加强无氧训练提升 Station 表现。`;
  } else if (dominantSystem === 'Glycolytic') {
    analysis += `💡 建议：你的高强度耐力不错，注意提升有氧基础以改善跑步配速。`;
  } else {
    analysis += `💡 建议：你的爆发力突出，需要加强有氧耐力以维持全程表现。`;
  }
  
  return analysis;
}

function getDominantSystemName(system: string): string {
  switch (system) {
    case 'ATP-CP': return 'ATP-CP 系统 (爆发力)';
    case 'Glycolytic': return '糖酵解系统 (高强度)';
    case 'Aerobic': return '有氧氧化系统 (耐力)';
    default: return '混合供能';
  }
}

// ============================================
// 肌肉群疲劳分析
// ============================================

/**
 * 分析 HYROX 比赛中各肌肉群的疲劳程度
 * 
 * 基于各 Station 的动作特征：
 * - Sled Push, Wall Balls → 上肢推力 + 下肢
 * - Sled Pull, Rowing → 上肢拉力 + 核心
 * - Farmers Carry, Sandbag Lunges → 下肢 + 核心稳定性
 * - SkiErg → 上肢拉力 + 核心
 * - Burpee Broad Jump → 全身爆发力
 */
export function analyzeMuscleFatigue(splits: {
  skiErg: number; sledPush: number; burpeeBroadJump: number; rowing: number;
  farmersCarry: number; sandbagLunges: number; wallBalls: number;
  run1: number; run2: number; run3: number; run4: number;
  run5: number; run6: number; run7: number; run8: number;
}): {
  upperBodyPush: number;
  upperBodyPull: number;
  lowerBodyQuad: number;
  lowerBodyPosterior: number;
  coreStability: number;
  weakestGroup: string;
  strongestGroup: string;
  analysis: string;
} {
  // 计算平均跑步时间作为基准
  const avgRunTime = (splits.run1 + splits.run2 + splits.run3 + splits.run4 + 
                      splits.run5 + splits.run6 + splits.run7 + splits.run8) / 8;
  
  // 计算各 Station 相对疲劳指数 (用时越长，疲劳指数越高)
  // 标准化到 0-100 分 (100 表示表现优秀，0 表示疲劳严重)
  
  // 上肢推力：Sled Push + Wall Balls
  const pushTime = splits.sledPush + splits.wallBalls;
  const pushAvg = pushTime / 2;
  const upperBodyPush = Math.max(0, Math.min(100, Math.round(100 - (pushAvg - avgRunTime) / avgRunTime * 50)));
  
  // 上肢拉力：SkiErg + Rowing + Sled Pull (用 Farmers Carry 近似)
  const pullTime = splits.skiErg + splits.rowing;
  const pullAvg = pullTime / 2;
  const upperBodyPull = Math.max(0, Math.min(100, Math.round(100 - (pullAvg - avgRunTime) / avgRunTime * 50)));
  
  // 下肢股四头肌：Sled Push + Sandbag Lunges + Wall Balls
  const quadTime = splits.sledPush + splits.sandbagLunges + splits.wallBalls;
  const quadAvg = quadTime / 3;
  const lowerBodyQuad = Math.max(0, Math.min(100, Math.round(100 - (quadAvg - avgRunTime) / avgRunTime * 50)));
  
  // 下肢后链：Burpee Broad Jump + Farmers Carry
  const posteriorTime = splits.burpeeBroadJump + splits.farmersCarry;
  const posteriorAvg = posteriorTime / 2;
  const lowerBodyPosterior = Math.max(0, Math.min(100, Math.round(100 - (posteriorAvg - avgRunTime) / avgRunTime * 50)));
  
  // 核心稳定性：Farmers Carry + Sandbag Lunges + all runs
  const coreTime = splits.farmersCarry + splits.sandbagLunges;
  const coreAvg = coreTime / 2;
  const coreStability = Math.max(0, Math.min(100, Math.round(100 - (coreAvg - avgRunTime) / avgRunTime * 50)));
  
  // 找出最弱和最强肌群
  const muscleGroups = [
    { name: '上肢推力', score: upperBodyPush },
    { name: '上肢拉力', score: upperBodyPull },
    { name: '下肢股四头肌', score: lowerBodyQuad },
    { name: '下肢后链', score: lowerBodyPosterior },
    { name: '核心稳定性', score: coreStability }
  ];
  
  muscleGroups.sort((a, b) => a.score - b.score);
  const weakestGroup = muscleGroups[0].name;
  const strongestGroup = muscleGroups[muscleGroups.length - 1].name;
  
  // 生成分析文本
  const analysis = generateMuscleFatigueAnalysis({
    upperBodyPush,
    upperBodyPull,
    lowerBodyQuad,
    lowerBodyPosterior,
    coreStability,
    weakestGroup,
    strongestGroup
  });
  
  return {
    upperBodyPush,
    upperBodyPull,
    lowerBodyQuad,
    lowerBodyPosterior,
    coreStability,
    weakestGroup,
    strongestGroup,
    analysis
  };
}

function generateMuscleFatigueAnalysis(data: any): string {
  const { upperBodyPush, upperBodyPull, lowerBodyQuad, lowerBodyPosterior, coreStability, weakestGroup, strongestGroup } = data;
  
  let analysis = `肌肉群疲劳分析揭示了你的体能特征：\n\n`;
  
  analysis += `• 上肢推力：${upperBodyPush}/100 ${getScoreEmoji(upperBodyPush)}\n`;
  analysis += `• 上肢拉力：${upperBodyPull}/100 ${getScoreEmoji(upperBodyPull)}\n`;
  analysis += `• 下肢股四头肌：${lowerBodyQuad}/100 ${getScoreEmoji(lowerBodyQuad)}\n`;
  analysis += `• 下肢后链：${lowerBodyPosterior}/100 ${getScoreEmoji(lowerBodyPosterior)}\n`;
  analysis += `• 核心稳定性：${coreStability}/100 ${getScoreEmoji(coreStability)}\n\n`;
  
  analysis += `💪 最强肌群：${strongestGroup}\n`;
  analysis += `⚠️ 最弱肌群：${weakestGroup}\n\n`;
  
  analysis += `💡 训练建议：针对${weakestGroup}进行专项强化训练，同时保持${strongestGroup}的优势。`;
  
  return analysis;
}

function getScoreEmoji(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
}

// ============================================
// 整合分析
// ============================================

/**
 * 生成完整的进阶分析报告
 */
export function generateAdvancedAnalysis(splits: any): Partial<AnalysisReport> {
  const energyAnalysis = analyzeEnergySystem(splits);
  const muscleAnalysis = analyzeMuscleFatigue(splits);
  
  return {
    energySystemAnalysis: energyAnalysis,
    muscleFatigueAnalysis: muscleAnalysis
  };
}
