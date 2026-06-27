import { Router } from 'express';
import { getLogsRange, saveLog, deleteLog, duplicateLog } from '../controllers/logController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/range', authenticateToken, getLogsRange);
router.post('/', authenticateToken, saveLog);
router.delete('/:date', authenticateToken, deleteLog);
router.post('/duplicate', authenticateToken, duplicateLog);

export default router;
