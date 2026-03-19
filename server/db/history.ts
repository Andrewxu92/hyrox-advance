// HYROX History Data Query Utilities
// Provides historical data analysis and trends

import { getDatabase } from './index.js';
import { athletes, results, analysisReports, trainingPlans, trainingLogs } from './schema.js';
import { eq, desc, asc, and, gte, lte, sql, count } from 'drizzle-orm';

/**
 * Get athlete's performance history over time
 */
export async function getAthletePerformanceHistory(athleteId: string, options: {
  startDate?: string;
  endDate?: string;
  limit?: number;
} = {}) {
  const db = getDatabase();
  const { startDate, endDate, limit = 50 } = options;

  // Build conditions array
  const conditions: any[] = [eq(results.athleteId, athleteId)];
  
  if (startDate) {
    conditions.push(gte(results.raceDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(results.raceDate, endDate));
  }

  const resultList = await db.select().from(results)
    .where(and(...conditions))
    .orderBy(asc(results.raceDate))
    .limit(limit);

  // Calculate trends
  const trends = calculatePerformanceTrends(resultList);

  return {
    athleteId,
    count: resultList.length,
    results: resultList,
    trends,
  };
}

/**
 * Get athlete's analysis history
 */
export async function getAthleteAnalysisHistory(athleteId: string, options: {
  limit?: number;
  includeDetails?: boolean;
} = {}) {
  const db = getDatabase();
  const { limit = 10, includeDetails = false } = options;

  const analyses = await db.select({
    analysis: analysisReports,
    result: results,
  })
  .from(analysisReports)
  .leftJoin(results, eq(analysisReports.resultId, results.id))
  .where(eq(analysisReports.athleteId, athleteId))
  .orderBy(desc(analysisReports.createdAt))
  .limit(limit);

  // Parse JSON fields
  const parsedAnalyses = analyses.map(a => ({
    ...a.analysis,
    result: a.result,
    weaknesses: a.analysis.weaknesses ? JSON.parse(a.analysis.weaknesses) : null,
    strengths: a.analysis.strengths ? JSON.parse(a.analysis.strengths) : null,
    pacingAnalysis: a.analysis.pacingAnalysis ? JSON.parse(a.analysis.pacingAnalysis) : null,
    fitnessProfile: a.analysis.fitnessProfile ? JSON.parse(a.analysis.fitnessProfile) : null,
    recommendations: a.analysis.recommendations ? JSON.parse(a.analysis.recommendations) : null,
  }));

  // Calculate weakness/strength trends
  const weaknessTrends = calculateWeaknessTrends(parsedAnalyses);
  const scoreTrends = calculateScoreTrends(parsedAnalyses);

  return {
    athleteId,
    count: analyses.length,
    analyses: includeDetails ? parsedAnalyses : parsedAnalyses.map(a => ({
      id: a.id,
      resultId: a.resultId,
      overallScore: a.overallScore,
      level: a.level,
      createdAt: a.createdAt,
    })),
    trends: {
      weaknesses: weaknessTrends,
      scores: scoreTrends,
    },
  };
}

/**
 * Get athlete's training plan history
 */
export async function getAthleteTrainingHistory(athleteId: string, options: {
  status?: 'active' | 'completed' | 'paused';
  limit?: number;
} = {}) {
  const db = getDatabase();
  const { status, limit = 10 } = options;

  // Build conditions
  const conditions: any[] = [eq(trainingPlans.athleteId, athleteId)];
  
  if (status) {
    conditions.push(eq(trainingPlans.status, status));
  }

  const plans = await db.select().from(trainingPlans)
    .where(and(...conditions))
    .orderBy(desc(trainingPlans.createdAt))
    .limit(limit);

  // Parse weeks JSON
  const parsedPlans = plans.map(p => ({
    ...p,
    weeks: p.weeks ? JSON.parse(p.weeks) : null,
  }));

  // Get completion stats for each plan
  const plansWithStats = await Promise.all(
    parsedPlans.map(async (plan) => {
      const stats = await getTrainingPlanStats(plan.id);
      return { ...plan, stats };
    })
  );

  return {
    athleteId,
    count: plans.length,
    plans: plansWithStats,
  };
}

/**
 * Get training plan statistics
 */
async function getTrainingPlanStats(planId: string) {
  const db = getDatabase();

  const logs = await db.select().from(trainingLogs)
    .where(eq(trainingLogs.planId, planId));

  const totalSessions = logs.length;
  const completedSessions = logs.filter(l => l.completed).length;
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  const avgRating = logs
    .filter(l => l.rating)
    .reduce((sum, l) => sum + (l.rating || 0), 0) / completedSessions || 0;

  const totalDuration = logs
    .filter(l => l.completed)
    .reduce((sum, l) => sum + (l.duration || 0), 0);

  return {
    totalSessions,
    completedSessions,
    completionRate: Math.round(completionRate * 10) / 10,
    averageRating: Math.round(avgRating * 10) / 10,
    totalDuration,
  };
}

/**
 * Get global statistics
 */
export async function getGlobalStatistics() {
  const db = getDatabase();

  // Athlete stats
  const athleteCount = await db.select({ count: count() }).from(athletes);
  
  // Result stats
  const resultCount = await db.select({ count: count() }).from(results);
  const avgTime = await db.select({ 
    avg: sql<number>`AVG(${results.totalTime})` 
  }).from(results);

  // Best times by gender
  const bestTimes = await db.select({
    gender: athletes.gender,
    bestTime: sql<number>`MIN(${results.totalTime})`,
  })
  .from(results)
  .leftJoin(athletes, eq(results.athleteId, athletes.id))
  .groupBy(athletes.gender);

  // Analysis stats
  const analysisCount = await db.select({ count: count() }).from(analysisReports);

  // Training plan stats
  const planStats = await db.select({
    status: trainingPlans.status,
    count: count(),
  })
  .from(trainingPlans)
  .groupBy(trainingPlans.status);

  return {
    athletes: {
      total: athleteCount[0].count,
    },
    results: {
      total: resultCount[0].count,
      averageTime: Math.round(avgTime[0].avg || 0),
      bestTimesByGender: bestTimes,
    },
    analyses: {
      total: analysisCount[0].count,
    },
    trainingPlans: planStats,
  };
}

/**
 * Get station performance comparison
 */
export async function getStationPerformanceComparison(athleteId: string, resultIds: string[]) {
  const db = getDatabase();

  // Use sql template for IN clause
  const resultList = await db.select().from(results)
    .where(and(
      eq(results.athleteId, athleteId),
      sql`${results.id} IN (${sql.raw(resultIds.map(id => `'${id}'`).join(','))})`
    ))
    .orderBy(asc(results.raceDate));

  if (resultList.length < 2) {
    return { error: 'At least 2 results required for comparison' };
  }

  const stations = [
    'skiErg', 'sledPush', 'burpeeBroadJump', 'rowing',
    'farmersCarry', 'sandbagLunges', 'wallBalls'
  ];

  const comparison = stations.map(station => {
    const times = resultList.map(r => ({
      resultId: r.id,
      raceName: r.raceName,
      raceDate: r.raceDate,
      time: (r as any)[station],
    })).filter(t => t.time);

    if (times.length < 2) return null;

    const first = times[0].time;
    const last = times[times.length - 1].time;
    const improvement = first - last;
    const improvementPercent = ((improvement / first) * 100).toFixed(1);

    return {
      station,
      times,
      improvement,
      improvementPercent: parseFloat(improvementPercent),
      trend: improvement > 0 ? 'improving' : improvement < 0 ? 'declining' : 'stable',
    };
  }).filter(Boolean);

  return {
    athleteId,
    comparison,
    summary: {
      improving: comparison.filter(c => c?.trend === 'improving').length,
      declining: comparison.filter(c => c?.trend === 'declining').length,
      stable: comparison.filter(c => c?.trend === 'stable').length,
    },
  };
}

// Helper functions

function calculatePerformanceTrends(results: any[]) {
  if (results.length < 2) return null;

  const sorted = [...results].sort((a, b) => 
    new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime()
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const totalTimeChange = last.totalTime - first.totalTime;
  const totalTimeChangePercent = ((totalTimeChange / first.totalTime) * 100).toFixed(1);

  // Calculate run degradation
  const runTimes = sorted.map(r => ({
    run1: r.run1,
    run8: r.run8,
    degradation: r.run8 && r.run1 ? r.run8 - r.run1 : null,
  })).filter(r => r.degradation !== null);

  const avgDegradation = runTimes.length > 0
    ? runTimes.reduce((sum, r) => sum + (r.degradation || 0), 0) / runTimes.length
    : null;

  return {
    totalTime: {
      first: first.totalTime,
      last: last.totalTime,
      change: totalTimeChange,
      changePercent: parseFloat(totalTimeChangePercent),
      trend: totalTimeChange < 0 ? 'improving' : totalTimeChange > 0 ? 'declining' : 'stable',
    },
    runDegradation: {
      average: avgDegradation,
      trend: avgDegradation !== null
        ? avgDegradation < 10 ? 'excellent' : avgDegradation < 30 ? 'good' : 'needs_work'
        : null,
    },
    raceCount: sorted.length,
    timeSpan: {
      first: first.raceDate,
      last: last.raceDate,
      days: Math.round((new Date(last.raceDate).getTime() - new Date(first.raceDate).getTime()) / (1000 * 60 * 60 * 24)),
    },
  };
}

function calculateWeaknessTrends(analyses: any[]) {
  if (analyses.length < 2) return null;

  const sorted = [...analyses].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const firstWeaknesses = new Set(sorted[0].weaknesses || []);
  const lastWeaknesses = new Set(sorted[sorted.length - 1].weaknesses || []);

  const resolved = [...firstWeaknesses].filter(w => !lastWeaknesses.has(w));
  const newWeaknesses = [...lastWeaknesses].filter(w => !firstWeaknesses.has(w));
  const persistent = [...firstWeaknesses].filter(w => lastWeaknesses.has(w));

  return {
    resolved,
    new: newWeaknesses,
    persistent,
    totalAnalyses: sorted.length,
  };
}

function calculateScoreTrends(analyses: any[]) {
  if (analyses.length < 2) return null;

  const sorted = [...analyses].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const scores = sorted.map(a => a.overallScore).filter(s => s !== null);
  
  if (scores.length < 2) return null;

  const first = scores[0];
  const last = scores[scores.length - 1];
  const change = last - first;

  return {
    first,
    last,
    change,
    trend: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
    average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    highest: Math.max(...scores),
    lowest: Math.min(...scores),
  };
}
