import { Router } from 'express';
import { generateCode, pair, unlink, getPartnerStatus } from '../controllers/partnerController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/status', authenticateToken, getPartnerStatus);
router.post('/code', authenticateToken, generateCode);
router.post('/pair', authenticateToken, pair);
router.delete('/unlink', authenticateToken, unlink);

export default router;
// 
