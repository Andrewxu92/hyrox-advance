import { Router } from 'express';
import { postAnalysisNoPersist, postQuickAnalysis, getBenchmarks } from './analysis-route-handlers.js';

const router = Router();

router.post('/', postAnalysisNoPersist);
router.post('/quick', postQuickAnalysis);
router.get('/benchmarks', getBenchmarks);

export default router;
