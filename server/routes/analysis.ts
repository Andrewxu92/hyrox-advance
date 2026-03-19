import { Router } from 'express';
import {
  validateAnalysisRequest,
  validateQuickAnalysisRequest,
  runFullAnalysis,
  runQuickAnalysis,
  getBenchmarksForGender,
  ValidationError,
} from '../lib/analysis-handlers.js';

const router = Router();

// POST /api/analysis - Generate AI analysis
router.post('/', async (req, res) => {
  try {
    const { splits, athleteInfo } = validateAnalysisRequest(req.body);
    const data = await runFullAnalysis(splits, athleteInfo);
    res.json({ success: true, data });
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

// POST /api/analysis/quick - Quick analysis without AI
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

// GET /api/analysis/benchmarks - Get benchmark data
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

export default router;
