import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

// Helper to generate a unique 6-digit pairing code
const generateSyncCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateCode = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    // Delete any old pending syncs initiated by this user to avoid orphan rows
    await prisma.partnerSync.deleteMany({
      where: { initiatorId: userId, status: 'PENDING' },
    });

    const syncCode = generateSyncCode();

    const partnerSync = await prisma.partnerSync.create({
      data: {
        initiatorId: userId,
        syncCode,
        status: 'PENDING',
      },
    });

    return res.status(200).json({
      message: 'Pairing code generated. Valid for 10 minutes.',
      syncCode: partnerSync.syncCode,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error generating pairing code.' });
  }
};

export const pair = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId; // Receiver user ID
  const { code } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (!code) {
    return res.status(400).json({ error: 'Pairing code is required.' });
  }

  try {
    const pendingSync = await prisma.partnerSync.findUnique({
      where: { syncCode: code },
    });

    if (!pendingSync || pendingSync.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid, active, or expired pairing code.' });
    }

    if (pendingSync.initiatorId === userId) {
      return res.status(400).json({ error: 'Cannot pair with yourself.' });
    }

    // Connect receiver user and change state to ACCEPTED
    const updatedSync = await prisma.partnerSync.update({
      where: { id: pendingSync.id },
      data: {
        receiverId: userId,
        status: 'ACCEPTED',
      },
      include: {
        initiator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.status(200).json({
      message: 'Successfully paired with partner.',
      partner: updatedSync.initiator,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error during partner pairing.' });
  }
};

export const unlink = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    // Find active accepted relationship involving this user
    const activeSync = await prisma.partnerSync.findFirst({
      where: {
        OR: [
          { initiatorId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!activeSync) {
      return res.status(404).json({ error: 'No active partner connection found to unlink.' });
    }

    await prisma.partnerSync.delete({
      where: { id: activeSync.id },
    });

    return res.status(200).json({ message: 'Partner link severed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error disconnecting partner.' });
  }
};

export const getPartnerStatus = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const activeSync = await prisma.partnerSync.findFirst({
      where: {
        OR: [
          { initiatorId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        initiator: {
          select: { id: true, name: true, email: true }
        },
        receiver: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!activeSync) {
      return res.status(200).json({ paired: false });
    }

    const partner = activeSync.initiatorId === userId ? activeSync.receiver : activeSync.initiator;

    return res.status(200).json({
      paired: true,
      syncId: activeSync.id,
      partner,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error retrieving partner status.' });
  }
};
