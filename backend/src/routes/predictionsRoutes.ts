import { Router } from 'express';
import { getForecast } from '../controllers/predictionsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/forecast', authenticateToken, getForecast);

export default router;
