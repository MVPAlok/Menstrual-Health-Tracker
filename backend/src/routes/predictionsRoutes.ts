import { Router } from 'express';
import { getForecast, getProfileStats, getCycleComparison, getRecentChanges, exportReport } from '../controllers/predictionsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/forecast', authenticateToken, getForecast);
router.get('/profile-stats', authenticateToken, getProfileStats);
router.get('/cycle-comparison', authenticateToken, getCycleComparison);
router.get('/recent-changes', authenticateToken, getRecentChanges);
router.get('/export', authenticateToken, exportReport);

export default router;
