// Analysis API with DB persistence + report CRUD (shared core handlers in analysis-route-handlers)

import { Router } from 'express';
import { postAnalysisWithPersist, postQuickAnalysis, getBenchmarks } from './analysis-route-handlers.js';
import { getDatabase } from '../db/index.js';
import { analysisReports, results, athletes } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

const router = Router();

function parseJsonField(raw: string | null): unknown {
  if (raw == null || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('Invalid JSON in analysis report column');
    return null;
  }
}

function parseReportJsonFields(analysis: {
  weaknesses: string | null;
  strengths: string | null;
  pacingAnalysis: string | null;
  fitnessProfile: string | null;
  recommendations: string | null;
  energySystemAnalysis: string | null;
  muscleFatigueAnalysis: string | null;
}) {
  return {
    weaknesses: parseJsonField(analysis.weaknesses),
    strengths: parseJsonField(analysis.strengths),
    pacingAnalysis: parseJsonField(analysis.pacingAnalysis),
    fitnessProfile: parseJsonField(analysis.fitnessProfile),
    recommendations: parseJsonField(analysis.recommendations),
    energySystemAnalysis: parseJsonField(analysis.energySystemAnalysis),
    muscleFatigueAnalysis: parseJsonField(analysis.muscleFatigueAnalysis),
  };
}

router.post('/', postAnalysisWithPersist);
router.post('/quick', postQuickAnalysis);
router.get('/benchmarks', getBenchmarks);

// ============================================
// GET /api/analysis-db/reports
// ============================================
router.get('/reports', async (req, res) => {
  try {
    const db = getDatabase();
    const { athleteId, resultId, limit = 50 } = req.query;

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

    const parsedReports = reports.map((r) => ({
      ...r.analysis,
      ...parseReportJsonFields(r.analysis),
      athlete: r.athlete,
      result: r.result,
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
      error: 'Failed to fetch analysis reports',
    });
  }
});

// ============================================
// GET /api/analysis-db/reports/:id
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
        error: 'Analysis report not found',
      });
    }

    const r = reportList[0];
    const parsedReport = {
      ...r.analysis,
      ...parseReportJsonFields(r.analysis),
      athlete: r.athlete,
      result: r.result,
    };

    res.json({
      success: true,
      data: parsedReport,
    });
  } catch (error) {
    console.error('Get analysis report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis report',
    });
  }
});

// ============================================
// DELETE /api/analysis-db/reports/:id
// ============================================
router.delete('/reports/:id', async (req, res) => {
  try {
    const db = getDatabase();

    const existing = await db.select().from(analysisReports)
      .where(eq(analysisReports.id, req.params.id));

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Analysis report not found',
      });
    }

    await db.delete(analysisReports)
      .where(eq(analysisReports.id, req.params.id));

    res.json({
      success: true,
      message: 'Analysis report deleted successfully',
    });
  } catch (error) {
    console.error('Delete analysis report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete analysis report',
    });
  }
});

export default router;
