import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { triggerNotification, getOrCreatePreferences, getVapidPublicKey } from '../services/notificationService';

// GET /notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  const { category, isRead, limit = '20', offset = '0' } = req.query;

  try {
    const whereClause: any = { userId };

    if (category) {
      whereClause.category = String(category);
    }

    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }

    // Support pagination
    const take = parseInt(String(limit), 10) || 20;
    const skip = parseInt(String(offset), 10) || 0;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      prisma.notification.count({ where: whereClause })
    ]);

    return res.status(200).json({
      notifications,
      pagination: {
        total,
        limit: take,
        offset: skip
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Server error retrieving notifications.' });
  }
};

// GET /notifications/unread
export const getUnreadNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  try {
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return res.status(200).json({ count: unreadCount, notifications });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return res.status(500).json({ error: 'Server error retrieving unread count.' });
  }
};

// POST /notifications (Admin/Testing trigger)
export const createNotification = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  const { title, message, category, type, priority, icon, actionUrl } = req.body;

  if (!title || !message || !category || !type) {
    return res.status(400).json({ error: 'Required fields missing: title, message, category, type.' });
  }

  try {
    const notification = await triggerNotification(userId, title, message, category, type, {
      priority,
      icon,
      actionUrl
    });

    return res.status(201).json({ message: 'Notification created successfully.', notification });
  } catch (error) {
    console.error('Error triggering manual notification:', error);
    return res.status(500).json({ error: 'Server error generating notification.' });
  }
};

// PATCH /notifications/:id/read
export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  try {
    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification record not found.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.status(200).json({ message: 'Notification marked as read.', notification: updated });
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ error: 'Server error updating notification status.' });
  }
};

// PATCH /notifications/read-all
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return res.status(500).json({ error: 'Server error updating notifications.' });
  }
};

// DELETE /notifications/:id
export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  try {
    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification record not found.' });
    }

    await prisma.notification.delete({ where: { id } });

    return res.status(200).json({ message: 'Notification removed successfully.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Server error deleting notification.' });
  }
};

// DELETE /notifications/clear
export const clearNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  try {
    await prisma.notification.deleteMany({ where: { userId } });
    return res.status(200).json({ message: 'All notifications cleared successfully.' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return res.status(500).json({ error: 'Server error clearing notifications.' });
  }
};

// GET /notification-preferences
export const getNotificationPreferences = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  try {
    const prefs = await getOrCreatePreferences(userId);
    return res.status(200).json(prefs);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return res.status(500).json({ error: 'Server error retrieving preferences.' });
  }
};

// PATCH /notification-preferences
export const updateNotificationPreferences = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  const {
    dailyReminder,
    cycleReminder,
    hydrationReminder,
    sleepReminder,
    stressReminder,
    achievementNotification,
    insightNotification,
    browserPushEnabled,
    emailEnabled,
    preferredReminderTime,
    timezone
  } = req.body;

  try {
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        dailyReminder: dailyReminder !== undefined ? dailyReminder : undefined,
        cycleReminder: cycleReminder !== undefined ? cycleReminder : undefined,
        hydrationReminder: hydrationReminder !== undefined ? hydrationReminder : undefined,
        sleepReminder: sleepReminder !== undefined ? sleepReminder : undefined,
        stressReminder: stressReminder !== undefined ? stressReminder : undefined,
        achievementNotification: achievementNotification !== undefined ? achievementNotification : undefined,
        insightNotification: insightNotification !== undefined ? insightNotification : undefined,
        browserPushEnabled: browserPushEnabled !== undefined ? browserPushEnabled : undefined,
        emailEnabled: emailEnabled !== undefined ? emailEnabled : undefined,
        preferredReminderTime: preferredReminderTime || undefined,
        timezone: timezone || undefined
      },
      create: {
        userId,
        dailyReminder: dailyReminder ?? true,
        cycleReminder: cycleReminder ?? true,
        hydrationReminder: hydrationReminder ?? true,
        sleepReminder: sleepReminder ?? true,
        stressReminder: stressReminder ?? true,
        achievementNotification: achievementNotification ?? true,
        insightNotification: insightNotification ?? true,
        browserPushEnabled: browserPushEnabled ?? false,
        emailEnabled: emailEnabled ?? false,
        preferredReminderTime: preferredReminderTime || '09:00',
        timezone: timezone || 'UTC'
      }
    });

    return res.status(200).json({ message: 'Notification preferences updated successfully.', preferences: prefs });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return res.status(500).json({ error: 'Server error updating preferences.' });
  }
};

// GET /notifications/vapid-key
export const getVapidKey = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({ publicKey: getVapidPublicKey() });
};

// POST /notifications/subscribe
export const subscribePush = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  const { subscription } = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return res.status(400).json({ error: 'Invalid push subscription payload.' });
  }

  try {
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });

    // Automatically enable browser push in settings when subscribing
    await prisma.notificationPreference.upsert({
      where: { userId },
      update: { browserPushEnabled: true },
      create: { userId, browserPushEnabled: true }
    });

    return res.status(201).json({ message: 'Browser push registered successfully.', subscription: sub });
  } catch (error) {
    console.error('Error subscribing push notifications:', error);
    return res.status(500).json({ error: 'Server error saving subscription.' });
  }
};

// POST /notifications/unsubscribe
export const unsubscribePush = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing subscription endpoint to remove.' });
  }

  try {
    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint }
    });

    return res.status(200).json({ message: 'Push subscription removed successfully.' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return res.status(500).json({ error: 'Server error removing subscription.' });
  }
};
