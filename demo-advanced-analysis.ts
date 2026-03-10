#!/usr/bin/env tsx
/**
 * HYROX Advanced Analysis Demo
 * 演示能量系统分析和肌肉群疲劳分析功能
 * 
 * 运行：npx tsx demo-advanced-analysis.ts
 */

import { analyzeEnergySystem, analyzeMuscleFatigue, generateAdvancedAnalysis } from './server/lib/advanced-analysis.js';

// 示例成绩数据（进阶级选手）
const mockSplits = {
  run1: 270, skiErg: 240, run2: 275, sledPush: 210,
  run3: 280, burpeeBroadJump: 180, run4: 285, rowing: 300,
  run5: 290, farmersCarry: 220, run6: 295, sandbagLunges: 240,
  run7: 300, wallBalls: 200, run8: 305
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

console.log('🏃 HYROX Advanced Analysis Demo\n');
console.log('='.repeat(60));

// 计算总成绩
const totalTime = Object.values(mockSplits).reduce((a, b) => a + b, 0);
console.log(`\n📊 总成绩：${formatTime(totalTime)} (${totalTime}秒)`);

// 能量系统分析
console.log('\n' + '='.repeat(60));
console.log('⚡ 能量系统分析');
console.log('='.repeat(60));

const energyAnalysis = analyzeEnergySystem(mockSplits);

console.log(`\n主导能量系统：${energyAnalysis.dominantSystem}`);
console.log('\n各系统贡献:');
console.log(`  ATP-CP (爆发力):     ${'█'.repeat(energyAnalysis.atpCpContribution / 2)} ${energyAnalysis.atpCpContribution}%`);
console.log(`  糖酵解 (高强度):     ${'█'.repeat(energyAnalysis.glycolyticContribution / 2)} ${energyAnalysis.glycolyticContribution}%`);
console.log(`  有氧氧化 (耐力):     ${'█'.repeat(energyAnalysis.aerobicContribution / 2)} ${energyAnalysis.aerobicContribution}%`);

console.log(`\n💡 分析:`);
console.log(energyAnalysis.analysis);

// 肌肉群疲劳分析
console.log('\n' + '='.repeat(60));
console.log('💪 肌肉群疲劳分析');
console.log('='.repeat(60));

const muscleAnalysis = analyzeMuscleFatigue(mockSplits);

console.log('\n各肌群评分 (0-100):');
console.log(`  上肢推力：     ${'█'.repeat(muscleAnalysis.upperBodyPush / 2)} ${muscleAnalysis.upperBodyPush}/100`);
console.log(`  上肢拉力：     ${'█'.repeat(muscleAnalysis.upperBodyPull / 2)} ${muscleAnalysis.upperBodyPull}/100`);
console.log(`  下肢股四头肌： ${'█'.repeat(muscleAnalysis.lowerBodyQuad / 2)} ${muscleAnalysis.lowerBodyQuad}/100`);
console.log(`  下肢后链：     ${'█'.repeat(muscleAnalysis.lowerBodyPosterior / 2)} ${muscleAnalysis.lowerBodyPosterior}/100`);
console.log(`  核心稳定性：   ${'█'.repeat(muscleAnalysis.coreStability / 2)} ${muscleAnalysis.coreStability}/100`);

console.log(`\n💪 最强肌群：${muscleAnalysis.strongestGroup}`);
console.log(`⚠️  最弱肌群：${muscleAnalysis.weakestGroup}`);

console.log(`\n💡 分析:`);
console.log(muscleAnalysis.analysis);

// 训练建议
console.log('\n' + '='.repeat(60));
console.log('🎯 训练建议');
console.log('='.repeat(60));

console.log('\n基于能量系统分析:');
if (energyAnalysis.dominantSystem === 'Aerobic') {
  console.log('  ✅ 你的有氧基础良好');
  console.log('  📌 建议加强无氧训练提升 Station 表现:');
  console.log('     - 高强度间歇训练 (HIIT)');
  console.log('     - 爆发力训练 (Sled Push, Wall Balls)');
  console.log('     - 糖酵解系统训练 (30s-2min 高强度间歇)');
} else if (energyAnalysis.dominantSystem === 'Glycolytic') {
  console.log('  ✅ 你的高强度耐力不错');
  console.log('  📌 建议提升有氧基础改善跑步配速:');
  console.log('     - LSD 长距离慢跑');
  console.log('     - 阈值跑训练');
  console.log('     - 有氧耐力基础训练');
} else {
  console.log('  ✅ 你的爆发力突出');
  console.log('  📌 建议加强有氧耐力维持全程表现:');
  console.log('     - 增加有氧训练比例');
  console.log('     - 混合训练（力量 + 有氧）');
  console.log('     - 模拟赛配速训练');
}

console.log('\n基于肌肉群分析:');
console.log(`  📌 重点强化：${muscleAnalysis.weakestGroup}`);
console.log(`  ✅ 保持优势：${muscleAnalysis.strongestGroup}`);

if (muscleAnalysis.weakestGroup.includes('上肢')) {
  console.log('\n  推荐训练:');
  console.log('     - 卧推/俯卧撑 (推力)');
  console.log('     - 引体向上/划船 (拉力)');
  console.log('     - 肩部推举');
} else if (muscleAnalysis.weakestGroup.includes('下肢')) {
  console.log('\n  推荐训练:');
  console.log('     - 深蹲/腿举');
  console.log('     - 硬拉/罗马尼亚硬拉');
  console.log('     - 弓步蹲');
} else if (muscleAnalysis.weakestGroup.includes('核心')) {
  console.log('\n  推荐训练:');
  console.log('     - 平板支撑');
  console.log('     - 俄罗斯转体');
  console.log('     - 死虫式');
}

console.log('\n' + '='.repeat(60));
console.log('✅ Demo 完成！\n');

// 生成完整分析报告
console.log('📄 生成完整分析报告...');
const fullReport = generateAdvancedAnalysis(mockSplits);
console.log('报告字段:', Object.keys(fullReport));
console.log('\n完整报告 JSON:');
console.log(JSON.stringify(fullReport, null, 2));
