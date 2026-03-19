// Analysis API Routes with Database Persistence
// Uses shared analysis-handlers for validation and analysis logic

import { Router } from 'express';
import {
  validateAnalysisRequest,
  validateQuickAnalysisRequest,
  runFullAnalysis,
  runQuickAnalysis,
  getBenchmarksForGender,
  ValidationError,
} from '../lib/analysis-handlers.js';
import { getDatabase } from '../db/index.js';
import { analysisReports, results, athletes, type NewAnalysisReport } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

const router = Router();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// POST /api/analysis-db - Generate AI analysis and save to database
router.post('/', async (req, res) => {
  try {
    const { splits, athleteInfo } = validateAnalysisRequest(req.body);
    const { resultId, athleteId, saveToDatabase = true } = (req.body || {}) as {
      resultId?: string;
      athleteId?: string;
      saveToDatabase?: boolean;
    };

    const combinedAnalysis = await runFullAnalysis(splits, athleteInfo);

    let savedAnalysisId: string | null = null;
    if (saveToDatabase) {
      try {
        const db = getDatabase();
        let actualAthleteId = athleteId ?? null;
        let actualResultId = resultId ?? null;

        if (athleteId) {
          const athleteList = await db.select().from(athletes).where(eq(athletes.id, athleteId));
          if (athleteList.length === 0) {
            return res.status(404).json({ success: false, error: 'Athlete not found' });
          }
        }

        if (resultId) {
          const resultList = await db.select().from(results).where(eq(results.id, resultId));
          if (resultList.length === 0) {
            return res.status(404).json({ success: false, error: 'Result not found' });
          }
          if (!actualAthleteId) actualAthleteId = resultList[0].athleteId;
        }

        const newAnalysis: NewAnalysisReport = {
          id: generateId(),
          resultId: actualResultId,
          athleteId: actualAthleteId ?? 'anonymous',
          overallScore: (combinedAnalysis.overallScore as number) ?? null,
          level: (combinedAnalysis.level as 'beginner' | 'intermediate' | 'advanced' | 'elite') ?? null,
          weaknesses: combinedAnalysis.weaknesses ? JSON.stringify(combinedAnalysis.weaknesses) : null,
          strengths: combinedAnalysis.strengths ? JSON.stringify(combinedAnalysis.strengths) : null,
          pacingAnalysis: combinedAnalysis.pacingAnalysis ? JSON.stringify(combinedAnalysis.pacingAnalysis) : null,
          fitnessProfile: combinedAnalysis.fitnessProfile ? JSON.stringify(combinedAnalysis.fitnessProfile) : null,
          recommendations: combinedAnalysis.recommendations ? JSON.stringify(combinedAnalysis.recommendations) : null,
          aiSummary: (combinedAnalysis.aiSummary as string) ?? null,
          energySystemAnalysis: combinedAnalysis.energySystemAnalysis ? JSON.stringify(combinedAnalysis.energySystemAnalysis) : null,
          muscleFatigueAnalysis: combinedAnalysis.muscleFatigueAnalysis ? JSON.stringify(combinedAnalysis.muscleFatigueAnalysis) : null,
          createdAt: new Date().toISOString(),
        };

        await db.insert(analysisReports).values(newAnalysis);
        savedAnalysisId = newAnalysis.id;
        console.log(`✅ Analysis saved to database: ${savedAnalysisId}`);
      } catch (dbError) {
        console.error('⚠️ Failed to save analysis to database:', dbError);
      }
    }

    res.json({
      success: true,
      data: { ...combinedAnalysis, savedAnalysisId },
      message: savedAnalysisId
        ? 'Analysis generated and saved to database'
        : 'Analysis generated (not saved to database)',
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    console.error('Analysis route error:', err);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      error: 'Failed to generate analysis',
      ...(isDev && { message: err instanceof Error ? err.message : 'Unknown error' }),
    });
  }
});

// POST /api/analysis-db/quick - Quick analysis without AI
router.post('/quick', async (req, res) => {
  try {
    const { splits, athleteInfo } = validateQuickAnalysisRequest(req.body);
    const data = runQuickAnalysis(splits, athleteInfo);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    console.error('Quick analysis error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate quick analysis' });
  }
});

// GET /api/analysis-db/benchmarks - Get benchmark data
router.get('/benchmarks', (req, res) => {
  try {
    const gender = (req.query.gender as string) || 'male';
    const data = getBenchmarksForGender(gender);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    throw err;
  }
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
      energySystemAnalysis: r.analysis.energySystemAnalysis ? JSON.parse(r.analysis.energySystemAnalysis) : null,
      muscleFatigueAnalysis: r.analysis.muscleFatigueAnalysis ? JSON.parse(r.analysis.muscleFatigueAnalysis) : null,
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
      energySystemAnalysis: r.analysis.energySystemAnalysis ? JSON.parse(r.analysis.energySystemAnalysis) : null,
      muscleFatigueAnalysis: r.analysis.muscleFatigueAnalysis ? JSON.parse(r.analysis.muscleFatigueAnalysis) : null,
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