/**
 * Shared HTTP handlers for /api/analysis and /api/analysis-db (no persistence vs DB save).
 */

import type { Request, Response } from 'express';
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
import { eq } from 'drizzle-orm';
import { generateId } from '../lib/id.js';

/** POST / — AI analysis only (no DB). */
export async function postAnalysisNoPersist(req: Request, res: Response): Promise<void> {
  try {
    const { splits, athleteInfo } = validateAnalysisRequest(req.body);
    const data = await runFullAnalysis(splits, athleteInfo);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    console.error('Analysis route error:', err);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      error: 'Failed to generate analysis',
      ...(isDev && { message: err instanceof Error ? err.message : 'Unknown error' }),
    });
  }
}

/** POST / — AI analysis + optional DB persistence. */
export async function postAnalysisWithPersist(req: Request, res: Response): Promise<void> {
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
            res.status(404).json({ success: false, error: 'Athlete not found' });
            return;
          }
        }

        if (resultId) {
          const resultList = await db.select().from(results).where(eq(results.id, resultId));
          if (resultList.length === 0) {
            res.status(404).json({ success: false, error: 'Result not found' });
            return;
          }
          if (!actualAthleteId) actualAthleteId = resultList[0].athleteId;
        }

        if (!actualAthleteId) {
          res.status(400).json({
            success: false,
            error:
              'athleteId is required when saveToDatabase is true (or pass resultId to infer athlete from result)',
          });
          return;
        }

        const newAnalysis: NewAnalysisReport = {
          id: generateId(),
          resultId: actualResultId,
          athleteId: actualAthleteId,
          overallScore: (combinedAnalysis.overallScore as number) ?? null,
          level: (combinedAnalysis.level as 'beginner' | 'intermediate' | 'advanced' | 'elite') ?? null,
          weaknesses: combinedAnalysis.weaknesses ? JSON.stringify(combinedAnalysis.weaknesses) : null,
          strengths: combinedAnalysis.strengths ? JSON.stringify(combinedAnalysis.strengths) : null,
          pacingAnalysis: combinedAnalysis.pacingAnalysis ? JSON.stringify(combinedAnalysis.pacingAnalysis) : null,
          fitnessProfile: combinedAnalysis.fitnessProfile ? JSON.stringify(combinedAnalysis.fitnessProfile) : null,
          recommendations: combinedAnalysis.recommendations ? JSON.stringify(combinedAnalysis.recommendations) : null,
          aiSummary: (combinedAnalysis.aiSummary as string) ?? null,
          energySystemAnalysis: combinedAnalysis.energySystemAnalysis
            ? JSON.stringify(combinedAnalysis.energySystemAnalysis)
            : null,
          muscleFatigueAnalysis: combinedAnalysis.muscleFatigueAnalysis
            ? JSON.stringify(combinedAnalysis.muscleFatigueAnalysis)
            : null,
          createdAt: new Date().toISOString(),
        };

        await db.insert(analysisReports).values(newAnalysis);
        savedAnalysisId = newAnalysis.id;
        console.log(`✅ Analysis saved to database: ${savedAnalysisId}`);
      } catch (dbError) {
        console.error('⚠️ Failed to save analysis to database:', dbError);
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({
          success: false,
          error: 'Failed to save analysis to database',
          data: combinedAnalysis,
          ...(isDev && {
            message: dbError instanceof Error ? dbError.message : String(dbError),
          }),
        });
        return;
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
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    console.error('Analysis route error:', err);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      error: 'Failed to generate analysis',
      ...(isDev && { message: err instanceof Error ? err.message : 'Unknown error' }),
    });
  }
}

/** POST /quick */
export async function postQuickAnalysis(req: Request, res: Response): Promise<void> {
  try {
    const { splits, athleteInfo } = validateQuickAnalysisRequest(req.body);
    const data = runQuickAnalysis(splits, athleteInfo);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    console.error('Quick analysis error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate quick analysis' });
  }
}

/** GET /benchmarks */
export function getBenchmarks(req: Request, res: Response): void {
  try {
    const gender = (req.query.gender as string) || 'male';
    const data = getBenchmarksForGender(gender);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    console.error('Benchmarks error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch benchmarks' });
  }
}
