import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { calculatePredictions } from '../services/cycleEngine';

export const getForecast = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { offset } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const offsetDays = offset ? Math.max(0, parseInt(String(offset), 10)) : 0;
    const forecast = await calculatePredictions(userId, offsetDays);
    return res.status(200).json(forecast);
  } catch (error: any) {
    console.error('Error generating cycle forecast:', error);
    return res.status(500).json({ error: error.message || 'Server error generating predictions.' });
  }
};
