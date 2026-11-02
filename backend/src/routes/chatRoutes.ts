import { Router } from 'express';
import { getChatHistory, sendMessage, clearChatHistory } from '../controllers/chatController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/history', authenticateToken, getChatHistory);
router.post('/message', authenticateToken, sendMessage);
router.delete('/history', authenticateToken, clearChatHistory);

export default router;

