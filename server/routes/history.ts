// History API Routes
// Provides historical data analysis and trends

import { Router } from 'express';
import { getDatabase } from '../db/index.js';
import { athletes, results, analysisReports, trainingPlans, trainingLogs } from '../db/schema.js';
import { eq, desc, asc, and, gte, lte, sql, count } from 'drizzle-orm';
import { formatTime } from '../lib/hyrox-data.js';

const router = Router();

// ============================================
// GET /api/history/athletes/:athleteId/performance - Performance history
// ============================================
router.get('/athletes/:athleteId/performance', async (req, res) => {
  try {
    const db = getDatabase();
    const { athleteId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    // Verify athlete exists
    const athleteList = await db.select().from(athletes).where(eq(athletes.id, athleteId));
    if (athleteList.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Athlete not found'
      });
    }

    const conditions = [eq(results.athleteId, athleteId)];
    
    if (startDate) {
      conditions.push(gte(results.raceDate, startDate as string));
    }
    if (endDate) {
      conditions.push(lte(results.raceDate, endDate as string));
    }
    
    const resultList = await db.select().from(results)
      .where(and(...conditions))
      .orderBy(asc(results.raceDate))
      .limit(Number(limit));

    // Calculate trends
    const trends = calculatePerformanceTrends(resultList);

    // Format results with readable times
    const formattedResults = resultList.map(r => ({
      ...r,
      formattedTotalTime: formatTime(r.totalTime),
      formattedSplits: {
        run1: r.run1 ? formatTime(r.run1) : null,
        skiErg: r.skiErg ? formatTime(r.skiErg) : null,
        run2: r.run2 ? formatTime(r.run2) : null,
        sledPush: r.sledPush ? formatTime(r.sledPush) : null,
        run3: r.run3 ? formatTime(r.run3) : null,
        burpeeBroadJump: r.burpeeBroadJump ? formatTime(r.burpeeBroadJump) : null,
        run4: r.run4 ? formatTime(r.run4) : null,
        rowing: r.rowing ? formatTime(r.rowing) : null,
        run5: r.run5 ? formatTime(r.run5) : null,
        farmersCarry: r.farmersCarry ? formatTime(r.farmersCarry) : null,
        run6: r.run6 ? formatTime(r.run6) : null,
        sandbagLunges: r.sandbagLunges ? formatTime(r.sandbagLunges) : null,
        run7: r.run7 ? formatTime(r.run7) : null,
        wallBalls: r.wallBalls ? formatTime(r.wallBalls) : null,
        run8: r.run8 ? formatTime(r.run8) : null,
      }
    }));

    res.json({
      success: true,
      data: {
        athlete: athleteList[0],
        count: resultList.length,
        results: formattedResults,
        trends,
      }
    });
  } catch (error) {
    console.error('Get performance history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance history'
    });
  }
});

// ============================================
// GET /api/history/athletes/:athleteId/analysis - Analysis history
// ============================================
router.get('/athletes/:athleteId/analysis', async (req, res) => {
  try {
    const db = getDatabase();
    const { athleteId } = req.params;
    const { limit = 10, includeDetails = 'false' } = req.query;

    // Verify athlete exists
    const athleteList = await db.select().from(athletes).where(eq(athletes.id, athleteId));
    if (athleteList.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Athlete not found'
      });
    }

    const query = db.select({
      analysis: analysisReports,
      result: results,
    })
    .from(analysisReports)
    .leftJoin(results, eq(analysisReports.resultId, results.id))
    .where(eq(analysisReports.athleteId, athleteId))
    .orderBy(desc(analysisReports.createdAt))
    .limit(Number(limit));

    const analyses = await query;

    // Parse JSON fields
    const parsedAnalyses = analyses.map(a => ({
      ...a.analysis,
      result: a.result,
      weaknesses: safeJsonParse(a.analysis.weaknesses),
      strengths: safeJsonParse(a.analysis.strengths),
      pacingAnalysis: safeJsonParse(a.analysis.pacingAnalysis),
      fitnessProfile: safeJsonParse(a.analysis.fitnessProfile),
      recommendations: safeJsonParse(a.analysis.recommendations),
    }));

    // Calculate trends
    const weaknessTrends = calculateWeaknessTrends(parsedAnalyses);
    const scoreTrends = calculateScoreTrends(parsedAnalyses);

    res.json({
      success: true,
      data: {
        athlete: athleteList[0],
        count: analyses.length,
        analyses: includeDetails === 'true' ? parsedAnalyses : parsedAnalyses.map(a => ({
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
      }
    });
  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis history'
    });
  }
});

// ============================================
// GET /api/history/athletes/:athleteId/training - Training history
// ============================================
router.get('/athletes/:athleteId/training', async (req, res) => {
  try {
    const db = getDatabase();
    const { athleteId } = req.params;
    const { status, limit = 10 } = req.query;

    // Verify athlete exists
    const athleteList = await db.select().from(athletes).where(eq(athletes.id, athleteId));
    if (athleteList.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Athlete not found'
      });
    }

    const conditions = [eq(trainingPlans.athleteId, athleteId)];
    
    if (status && ['active', 'completed', 'paused'].includes(status as string)) {
      conditions.push(eq(trainingPlans.status, status as 'active' | 'completed' | 'paused'));
    }
    
    const query = db.select().from(trainingPlans)
      .where(and(...conditions))
      .orderBy(desc(trainingPlans.createdAt))
      .limit(Number(limit));

    const plans = await query;

    // Parse weeks JSON and get stats for each plan
    const plansWithStats = await Promise.all(
      plans.map(async (plan) => {
        const stats = await getTrainingPlanStats(plan.id);
        return {
          ...plan,
          weeks: safeJsonParse(plan.weeks),
          stats,
        };
      })
    );

    res.json({
      success: true,
      data: {
        athlete: athleteList[0],
        count: plans.length,
        plans: plansWithStats,
      }
    });
  } catch (error) {
    console.error('Get training history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training history'
    });
  }
});

// ============================================
// GET /api/history/statistics - Global statistics
// ============================================
router.get('/statistics', async (req, res) => {
  try {
    const db = getDatabase();

    // Athlete stats
    const athleteCount = await db.select({ count: count() }).from(athletes);
    
    // Result stats
    const resultCount = await db.select({ count: count() }).from(results);
    const avgTimeResult = await db.select({ 
      avg: sql<number>`AVG(${results.totalTime})` 
    }).from(results);

    // Best times by gender
    const bestTimes = await db.select({
      gender: athletes.gender,
      bestTime: sql<number>`MIN(${results.totalTime})`,
      count: count(),
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

    // Recent activity
    const recentResults = await db.select({
      result: results,
      athlete: athletes,
    })
    .from(results)
    .leftJoin(athletes, eq(results.athleteId, athletes.id))
    .orderBy(desc(results.createdAt))
    .limit(5);

    res.json({
      success: true,
      data: {
        overview: {
          totalAthletes: athleteCount[0].count,
          totalResults: resultCount[0].count,
          totalAnalyses: analysisCount[0].count,
          averageTime: Math.round(avgTimeResult[0].avg || 0),
        },
        bestTimesByGender: bestTimes.map(b => ({
          gender: b.gender,
          bestTime: b.bestTime,
          formattedBestTime: formatTime(b.bestTime),
          count: b.count,
        })),
        trainingPlans: planStats,
        recentActivity: recentResults.map(r => ({
          ...r.result,
          athlete: r.athlete,
          formattedTotalTime: formatTime(r.result.totalTime),
        })),
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Helper functions

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

function safeJsonParse(json: string | null): any {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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

export default router;