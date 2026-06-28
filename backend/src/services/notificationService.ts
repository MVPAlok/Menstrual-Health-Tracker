import webpush from 'web-push';
import prisma from '../prisma';

let socketIoInstance: any = null;

// Initialize VAPID keys for browser push notifications
let publicVapidKey = process.env.PUBLIC_VAPID_KEY;
let privateVapidKey = process.env.PRIVATE_VAPID_KEY;

if (!publicVapidKey || !privateVapidKey) {
  // Dynamically generate keys on startup if not present in env variables
  const generatedKeys = webpush.generateVAPIDKeys();
  publicVapidKey = generatedKeys.publicKey;
  privateVapidKey = generatedKeys.privateKey;
  console.log('🔑 Generated VAPID Keys for Push Notifications:');
  console.log(`   PUBLIC_VAPID_KEY=${publicVapidKey}`);
  console.log(`   PRIVATE_VAPID_KEY=${privateVapidKey}`);
}

webpush.setVapidDetails(
  'mailto:support@lunacare.app',
  publicVapidKey,
  privateVapidKey
);

export const setSocketIoInstance = (io: any) => {
  socketIoInstance = io;
};

export const getVapidPublicKey = () => {
  return publicVapidKey;
};

// Ensure preferences exist for the user
export const getOrCreatePreferences = async (userId: string) => {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId }
  });
  if (!prefs) {
    try {
      prefs = await prisma.notificationPreference.create({
        data: {
          userId,
          timezone: 'UTC'
        }
      });
    } catch (e) {
      // Handle race condition if created concurrently
      prefs = await prisma.notificationPreference.findUnique({
        where: { userId }
      });
    }
  }
  return prefs;
};

// Check if a specific notification type is enabled by the user preferences
const isNotificationEnabled = (prefs: any, category: string): boolean => {
  if (!prefs) return true;
  switch (category) {
    case 'DAILY_REMINDERS':
      return prefs.dailyReminder;
    case 'CYCLE_NOTIFICATIONS':
      return prefs.cycleReminder;
    case 'HEALTH_NOTIFICATIONS':
      return prefs.hydrationReminder || prefs.sleepReminder || prefs.stressReminder;
    case 'AI_NOTIFICATIONS':
      return prefs.insightNotification;
    case 'ACHIEVEMENT_NOTIFICATIONS':
      return prefs.achievementNotification;
    case 'SYSTEM_NOTIFICATIONS':
      return true; // System / security events are always enabled
    default:
      return true;
  }
};

interface TriggerOptions {
  icon?: string;
  actionUrl?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  deliveryMethod?: 'IN_APP' | 'PUSH' | 'BOTH';
  expiresInHours?: number;
}

/**
 * Triggers a notification across in-app and browser channels based on preferences
 */
export const triggerNotification = async (
  userId: string,
  title: string,
  message: string,
  category: string,
  type: string,
  options: TriggerOptions = {}
) => {
  const prefs = await getOrCreatePreferences(userId);
  if (!prefs) return null;

  // 1. Verify user preferences allow this category
  if (!isNotificationEnabled(prefs, category)) {
    console.log(`🚫 Notification category ${category} is disabled for user:${userId}`);
    return null;
  }

  const priority = options.priority || 'MEDIUM';
  const deliveryMethod = options.deliveryMethod || (prefs.browserPushEnabled ? 'BOTH' : 'IN_APP');
  const actionUrl = options.actionUrl || '';
  const icon = options.icon || 'notifications';

  let expiresAt: Date | undefined;
  if (options.expiresInHours) {
    expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + options.expiresInHours);
  }

  // 2. Persist in database
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      category,
      type,
      priority,
      icon,
      deliveryMethod,
      actionUrl,
      expiresAt,
      isRead: false
    }
  });

  // 3. Deliver via In-App (Socket.io Real-Time)
  if (deliveryMethod === 'IN_APP' || deliveryMethod === 'BOTH') {
    if (socketIoInstance) {
      socketIoInstance.to(`user:${userId}`).emit('notification:received', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        type: notification.type,
        priority: notification.priority,
        icon: notification.icon,
        isRead: notification.isRead,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt
      });
      console.log(`📡 Emitted real-time WebSocket notification to user:${userId}`);
    }
  }

  // 4. Deliver via Browser Push
  if ((deliveryMethod === 'PUSH' || deliveryMethod === 'BOTH') && prefs.browserPushEnabled) {
    await sendPushNotification(userId, title, message, actionUrl);
  }

  return notification;
};

/**
 * Sends a push notification to all registered subscriptions of a user
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  actionUrl: string = ''
) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  });

  if (subscriptions.length === 0) {
    console.log(`ℹ️ No browser push subscriptions found for user:${userId}`);
    return;
  }

  console.log(`🚀 Dispatching push notifications to ${subscriptions.length} devices for user:${userId}`);

  const payload = JSON.stringify({
    title,
    body,
    actionUrl: actionUrl || '/dashboard'
  });

  const promises = subscriptions.map(async (sub) => {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    try {
      await webpush.sendNotification(pushSub, payload);
    } catch (err: any) {
      console.error(`❌ Push notification delivery failed for subscription: ${sub.id}`, err.statusCode);
      // Clean up invalid or expired subscriptions (Gone/Not Found codes)
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({
          where: { id: sub.id }
        });
        console.log(`🧹 Deleted expired browser push subscription: ${sub.id}`);
      }
    }
  });

  await Promise.all(promises);
};
