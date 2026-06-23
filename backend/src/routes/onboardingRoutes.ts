import { Router } from 'express';
import { getOnboarding, calibrate } from '../controllers/onboardingController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getOnboarding);
router.post('/calibrate', authenticateToken, calibrate);

export default router;
