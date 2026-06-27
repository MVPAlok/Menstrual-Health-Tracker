import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { calculatePredictions } from '../services/cycleEngine';
import { getProfileStats as getProfileStatsService, getCycleComparison as getCycleComparisonService, getRecentChanges as getRecentChangesService } from '../services/analyticsService';
import { generateCSVReport, generateDoctorHTMLReport } from '../services/reportsService';

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

export const getProfileStats = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const stats = await getProfileStatsService(userId);
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error generating profile stats:', error);
    return res.status(500).json({ error: error.message || 'Server error generating profile statistics.' });
  }
};

export const getCycleComparison = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const comparison = await getCycleComparisonService(userId);
    return res.status(200).json(comparison);
  } catch (error: any) {
    console.error('Error generating cycle comparison:', error);
    return res.status(500).json({ error: error.message || 'Server error generating cycle comparison.' });
  }
};

export const getRecentChanges = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const recentChanges = await getRecentChangesService(userId);
    return res.status(200).json(recentChanges);
  } catch (error: any) {
    console.error('Error generating recent changes:', error);
    return res.status(500).json({ error: error.message || 'Server error generating recent changes.' });
  }
};

export const exportReport = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { format } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    if (format === 'csv') {
      const csvData = await generateCSVReport(userId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=lunacare_health_report.csv');
      return res.status(200).send(csvData);
    } else {
      const htmlData = await generateDoctorHTMLReport(userId);
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(htmlData);
    }
  } catch (error: any) {
    console.error('Error exporting report:', error);
    return res.status(500).json({ error: error.message || 'Server error exporting health data.' });
  }
};
