import { Server, Socket } from 'socket.io';
import { verifySocketToken } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const registerSocketHandlers = (io: Server) => {
  // Attach JWT verification check
  io.use(verifySocketToken);

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`📡 Device connected. User Session: ${userId}`);

    // Join a private, single-user room for multi-device sync
    socket.join(`user:${userId}`);

    // Locate active partner syncs to join shared updates stream
    const syncRelation = await prisma.partnerSync.findFirst({
      where: {
        OR: [
          { initiatorId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' }
        ]
      }
    });

    if (syncRelation) {
      const roomName = `shared:${syncRelation.id}`;
      socket.join(roomName);
      console.log(`🔗 Joined partner sync channel: ${roomName}`);
    }

    // EVENT 1: Telemetry Data Updated (Emitted by frontend when logging mood, symptoms, or sleep)
    socket.on('log:save', async (data: { date: string; mood: string; symptoms: string[]; sleep: number; energy: number; stress: number; hydration: number }) => {
      try {
        // Broadcast telemetry data to other devices active on the same profile
        socket.to(`user:${userId}`).emit('log:sync', {
          date: data.date,
          log: data
        });

        // Broadcast to partner if sync connection is active
        if (syncRelation) {
          socket.to(`shared:${syncRelation.id}`).emit('partner:log_update', {
            partnerId: userId,
            date: data.date,
            mood: data.mood,
            symptoms: data.symptoms
          });
        }
      } catch (error) {
        socket.emit('error', 'Failed to broadcast real-time telemetry update.');
      }
    });

    // EVENT 2: Partner Typing/Interacting alert
    socket.on('partner:active_action', (data: { action: string }) => {
      if (syncRelation) {
        socket.to(`shared:${syncRelation.id}`).emit('partner:active_notification', {
          partnerId: userId,
          action: data.action
        });
      }
    });

    // EVENT 3: Clear session
    socket.on('disconnect', () => {
      console.log(`🔌 Session ended. Connection closed: ${userId}`);
    });
  });
};
