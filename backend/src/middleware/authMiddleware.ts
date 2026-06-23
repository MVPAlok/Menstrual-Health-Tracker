import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY_FOR_WEB_SIGNATURES';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  email?: string;
}

interface DecodedToken {
  userId: string;
  email: string;
}

// HTTP request JWT verification middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Access Denied: Invalid signature token.' });
  }
};

// WebSocket connection verification middleware
export const verifySocketToken = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication Error: Bearer token required.'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    socket.data.userId = decoded.userId; // Store userId in socket metadata
    next();
  } catch (error) {
    return next(new Error('Authentication Error: Invalid signature token.'));
  }
};
