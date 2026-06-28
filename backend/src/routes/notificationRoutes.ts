import { Router } from 'express';
import { 
  getNotifications, 
  getUnreadNotifications, 
  createNotification, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  clearNotifications,
  getVapidKey,
  subscribePush,
  unsubscribePush
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.post('/', createNotification);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/clear', clearNotifications);
router.delete('/:id', deleteNotification);

// Web Push Subscriptions
router.get('/vapid-key', getVapidKey);
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);

export default router;
