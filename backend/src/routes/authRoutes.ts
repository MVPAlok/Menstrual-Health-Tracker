import { Router } from 'express';
import { register, login, updateProfileImage, logout } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.put('/profile-image', authenticateToken, updateProfileImage);

export default router;
