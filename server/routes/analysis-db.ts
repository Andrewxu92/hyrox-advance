// Analysis API Routes with Database Persistence
// Extended version of analysis.ts with database storage

import { Router } from 'express';
import { generateAnalysis, AthleteInfo, HyroxSplits } from '../lib/openai.js';
import { calculateTotalTime, formatTime, determineLevel, getBenchmarks, STATION_DISPLAY_NAMES } from '../lib/hyrox-data.js';
import { generateAdvancedAnalysis } from '../lib/advanced-analysis.js';
import { getDatabase } from '../db/index.js';
import { analysisReports, results, athletes, type NewAnalysisReport } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

const router = Router();

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// POST /api/analysis - Generate AI analysis and save to database
// ============================================
router.post('/', async (req, res) => {
  try {
    const { splits, athleteInfo, resultId, athleteId, saveToDatabase = true } = req.body;
    
    // Validate input
    if (!splits || !athleteInfo) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required data: splits and athleteInfo are required' 
      });
    }

    // Validate splits has all required fields
    const requiredSplits = [
      'run1', 'skiErg', 'run2', 'sledPush',
      'run3', 'burpeeBroadJump', 'run4', 'rowing',
      'run5', 'farmersCarry', 'run6', 'sandbagLunges',
      'run7', 'wallBalls', 'run8'
    ];
    
    const missingSplits = requiredSplits.filter(key => !(key in splits) || splits[key] == null);
    if (missingSplits.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing splits: ${missingSplits.join(', ')}`
      });
    }

    // Validate athleteInfo
    if (!athleteInfo.gender || !['male', 'female'].includes(athleteInfo.gender)) {
      return res.status(400).json({
        success: false,
        error: 'athleteInfo.gender must be "male" or "female"'
      });
    }

    // Generate AI analysis
    const analysis = await generateAnalysis(splits as HyroxSplits, athleteInfo as AthleteInfo);
    
    // Generate advanced analysis (energy system + muscle fatigue)
    const advancedAnalysis = generateAdvancedAnalysis(splits);

    // Combine analysis results
    const combinedAnalysis = {
      ...analysis,
      ...advancedAnalysis,
    };

    // Save to database if requested
    let savedAnalysisId: string | null = null;
    if (saveToDatabase) {
      try {
        const db = getDatabase();
        
        // Validate athlete exists if athleteId provided
        let actualAthleteId = athleteId;
        if (athleteId) {
          const athleteList = await db.select().from(athletes).where(eq(athletes.id, athleteId));
          if (athleteList.length === 0) {
            return res.status(404).json({
              success: false,
              error: 'Athlete not found'
            });
          }
        }

        // Validate result exists if resultId provided
        let actualResultId = resultId;
        if (resultId) {
          const resultList = await db.select().from(results).where(eq(results.id, resultId));
          if (resultList.length === 0) {
            return res.status(404).json({
              success: false,
              error: 'Result not found'
            });
          }
          // Use athlete from result if not provided
          if (!actualAthleteId) {
            actualAthleteId = resultList[0].athleteId;
          }
        }

        // Create analysis report
        const newAnalysis: NewAnalysisReport = {
          id: generateId(),
          resultId: actualResultId || null,
          athleteId: actualAthleteId || 'anonymous',
          overallScore: combinedAnalysis.overallScore || null,
          level: combinedAnalysis.level || null,
          weaknesses: combinedAnalysis.weaknesses ? JSON.stringify(combinedAnalysis.weaknesses) : null,
          strengths: combinedAnalysis.strengths ? JSON.stringify(combinedAnalysis.strengths) : null,
          pacingAnalysis: combinedAnalysis.pacingAnalysis ? JSON.stringify(combinedAnalysis.pacingAnalysis) : null,
          fitnessProfile: combinedAnalysis.fitnessProfile ? JSON.stringify(combinedAnalysis.fitnessProfile) : null,
          recommendations: combinedAnalysis.recommendations ? JSON.stringify(combinedAnalysis.recommendations) : null,
          aiSummary: combinedAnalysis.aiSummary || null,
          createdAt: new Date().toISOString(),
        };

        await db.insert(analysisReports).values(newAnalysis);
        savedAnalysisId = newAnalysis.id;
        
        console.log(`✅ Analysis saved to database: ${savedAnalysisId}`);
      } catch (dbError) {
        console.error('⚠️ Failed to save analysis to database:', dbError);
        // Continue without failing - analysis is still returned
      }
    }

    res.json({
      success: true,
      data: {
        ...combinedAnalysis,
        savedAnalysisId,
      },
      message: savedAnalysisId 
        ? 'Analysis generated and saved to database' 
        : 'Analysis generated (not saved to database)',
    });
  } catch (error) {
    console.error('Analysis route error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      error: 'Failed to generate analysis',
      ...(isDev && { message: error instanceof Error ? error.message : 'Unknown error' })
    });
  }
});

// ============================================
// POST /api/analysis/quick - Quick analysis without AI
// ============================================
router.post('/quick', async (req, res) => {
  try {
    const { splits, athleteInfo } = req.body;
    
    if (!splits || !athleteInfo?.gender) {
      return res.status(400).json({
        success: false,
        error: 'Missing required data'
      });
    }

    const totalTime = calculateTotalTime(splits);
    const level = determineLevel(totalTime, athleteInfo.gender);
    const benchmarks = getBenchmarks(athleteInfo.gender);

    // Calculate station performance vs benchmarks
    const stationAnalysis = [];
    for (const [key, time] of Object.entries(splits)) {
      if (key.startsWith('run')) continue;
      
      const stationBenchmark = benchmarks[level].stations[key];
      if (stationBenchmark) {
        const avgBenchmark = (stationBenchmark.min + stationBenchmark.max) / 2;
        stationAnalysis.push({
          station: key,
          displayName: STATION_DISPLAY_NAMES[key] || key,
          time: time as number,
          formattedTime: formatTime(time as number),
          benchmark: avgBenchmark,
          gap: (time as number) - avgBenchmark
        });
      }
    }

    // Sort by performance (fastest first)
    stationAnalysis.sort((a, b) => a.time - b.time);

    // Analyze run pacing
    const runTimes = [
      splits.run1, splits.run2, splits.run3, splits.run4,
      splits.run5, splits.run6, splits.run7, splits.run8
    ];
    const firstRun = runTimes[0];
    const lastRun = runTimes[runTimes.length - 1];
    const avgRun = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;

    // Generate advanced analysis
    const advancedAnalysis = generateAdvancedAnalysis(splits);

    res.json({
      success: true,
      data: {
        totalTime,
        formattedTotalTime: formatTime(totalTime),
        level,
        stations: stationAnalysis,
        runAnalysis: {
          runs: runTimes.map((time, i) => ({
            runNumber: i + 1,
            time,
            formattedTime: formatTime(time),
            vsFirstRun: time - firstRun
          })),
          firstRun,
          lastRun,
          degradation: lastRun - firstRun,
          average: avgRun
        },
        ...advancedAnalysis
      }
    });
  } catch (error) {
    console.error('Quick analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quick analysis'
    });
  }
});

// ============================================
// GET /api/analysis/benchmarks - Get benchmark data
// ============================================
router.get('/benchmarks', (req, res) => {
  const { gender = 'male' } = req.query;
  
  if (!['male', 'female'].includes(gender as string)) {
    return res.status(400).json({
      success: false,
      error: 'gender must be "male" or "female"'
    });
  }

  const benchmarks = getBenchmarks(gender as 'male' | 'female');
  
  res.json({
    success: true,
    data: benchmarks
  });
});

// ============================================
// GET /api/analysis/reports - Get analysis reports from database
// ============================================
router.get('/reports', async (req, res) => {
  try {
    const db = getDatabase();
    const { athleteId, resultId, limit = 50 } = req.query;

    // Build conditions
    const conditions: any[] = [];
    if (athleteId) {
      conditions.push(eq(analysisReports.athleteId, athleteId as string));
    }
    if (resultId) {
      conditions.push(eq(analysisReports.resultId, resultId as string));
    }

    const reports = await db.select({
      analysis: analysisReports,
      athlete: athletes,
      result: results,
    })
    .from(analysisReports)
    .leftJoin(athletes, eq(analysisReports.athleteId, athletes.id))
    .leftJoin(results, eq(analysisReports.resultId, results.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(analysisReports.createdAt))
    .limit(Number(limit));

    // Parse JSON fields
    const parsedReports = reports.map(r => ({
      ...r.analysis,
      athlete: r.athlete,
      result: r.result,
      weaknesses: r.analysis.weaknesses ? JSON.parse(r.analysis.weaknesses) : null,
      strengths: r.analysis.strengths ? JSON.parse(r.analysis.strengths) : null,
      pacingAnalysis: r.analysis.pacingAnalysis ? JSON.parse(r.analysis.pacingAnalysis) : null,
      fitnessProfile: r.analysis.fitnessProfile ? JSON.parse(r.analysis.fitnessProfile) : null,
      recommendations: r.analysis.recommendations ? JSON.parse(r.analysis.recommendations) : null,
    }));

    res.json({
      success: true,
      count: reports.length,
      data: parsedReports,
    });
  } catch (error) {
    console.error('Get analysis reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis reports'
    });
  }
});

// ============================================
// GET /api/analysis/reports/:id - Get single analysis report
// ============================================
router.get('/reports/:id', async (req, res) => {
  try {
    const db = getDatabase();

    const reportList = await db.select({
      analysis: analysisReports,
      athlete: athletes,
      result: results,
    })
    .from(analysisReports)
    .leftJoin(athletes, eq(analysisReports.athleteId, athletes.id))
    .leftJoin(results, eq(analysisReports.resultId, results.id))
    .where(eq(analysisReports.id, req.params.id));

    if (reportList.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Analysis report not found'
      });
    }

    const r = reportList[0];
    const parsedReport = {
      ...r.analysis,
      athlete: r.athlete,
      result: r.result,
      weaknesses: r.analysis.weaknesses ? JSON.parse(r.analysis.weaknesses) : null,
      strengths: r.analysis.strengths ? JSON.parse(r.analysis.strengths) : null,
      pacingAnalysis: r.analysis.pacingAnalysis ? JSON.parse(r.analysis.pacingAnalysis) : null,
      fitnessProfile: r.analysis.fitnessProfile ? JSON.parse(r.analysis.fitnessProfile) : null,
      recommendations: r.analysis.recommendations ? JSON.parse(r.analysis.recommendations) : null,
    };

    res.json({
      success: true,
      data: parsedReport,
    });
  } catch (error) {
    console.error('Get analysis report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis report'
    });
  }
});

// ============================================
// DELETE /api/analysis/reports/:id - Delete analysis report
// ============================================
router.delete('/reports/:id', async (req, res) => {
  try {
    const db = getDatabase();

    // Check if report exists
    const existing = await db.select().from(analysisReports)
      .where(eq(analysisReports.id, req.params.id));

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Analysis report not found'
      });
    }

    await db.delete(analysisReports)
      .where(eq(analysisReports.id, req.params.id));

    res.json({
      success: true,
      message: 'Analysis report deleted successfully'
    });
  } catch (error) {
    console.error('Delete analysis report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete analysis report'
    });
  }
});

export default router;