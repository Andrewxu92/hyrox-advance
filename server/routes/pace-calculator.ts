import { Router } from 'express';
import { calculateTargetSplits, estimateFromSplits, type Gender } from '../lib/pace-calculator.js';

const router = Router();

/**
 * POST /api/pace-calculator/target-splits
 * Body: { targetTotalSeconds: number, gender: 'male' | 'female' }
 * Returns: suggested splits for 8 runs + 8 stations to hit target time
 */
router.post('/target-splits', (req, res) => {
  try {
    const { targetTotalSeconds, gender } = req.body ?? {};
    if (targetTotalSeconds == null || typeof targetTotalSeconds !== 'number' || targetTotalSeconds <= 0) {
      return res.status(400).json({
        success: false,
        error: 'targetTotalSeconds is required and must be a positive number (seconds)',
      });
    }
    if (!gender || !['male', 'female'].includes(gender)) {
      return res.status(400).json({
        success: false,
        error: 'gender must be "male" or "female"',
      });
    }
    const totalSec = Math.round(Math.min(3600 * 3, Math.max(60 * 45, targetTotalSeconds)));
    const data = calculateTargetSplits(totalSec, gender as Gender);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Pace calculator target-splits error:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate target splits' });
  }
});

/**
 * POST /api/pace-calculator/estimate
 * Body: { splits: Record<string, number>, gender?: 'male' | 'female' }
 * Returns: estimated total, missing segments, level if complete
 */
router.post('/estimate', (req, res) => {
  try {
    const { splits, gender } = req.body ?? {};
    if (!splits || typeof splits !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'splits is required and must be an object (segment key → seconds)',
      });
    }
    const data = estimateFromSplits({ splits, gender: gender as Gender | undefined });
    res.json({ success: true, data });
  } catch (err) {
    console.error('Pace calculator estimate error:', err);
    res.status(500).json({ success: false, error: 'Failed to estimate from splits' });
  }
});

export default router;
