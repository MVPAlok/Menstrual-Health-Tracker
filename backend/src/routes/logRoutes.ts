import { Router } from 'express';
import { getLogsRange, saveLog } from '../controllers/logController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/range', authenticateToken, getLogsRange);
router.post('/', authenticateToken, saveLog);

export default router;
