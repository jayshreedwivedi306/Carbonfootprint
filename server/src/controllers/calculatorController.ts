import { Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { AuthenticatedRequest } from '../middleware/auth';
import { CarbonService } from '../services/carbonService';

const logSchema = z.object({
  carMiles: z.number().nonnegative(),
  vehicleType: z.enum(['gasoline', 'hybrid', 'electric', 'none']),
  publicTransitMiles: z.number().nonnegative(),
  flightMiles: z.number().nonnegative(),
  electricityKwh: z.number().nonnegative(),
  gasTherms: z.number().nonnegative(),
  dietType: z.enum(['meat_heavy', 'average', 'vegetarian', 'vegan']),
});

export async function submitLog(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const inputs = logSchema.parse(req.body);
    const co2Metrics = CarbonService.calculateWeeklyFootprint(inputs);

    const log = await prisma.carbonLog.create({
      data: {
        userId: req.user.id,
        travelCo2: co2Metrics.travelCo2,
        energyCo2: co2Metrics.energyCo2,
        dietCo2: co2Metrics.dietCo2,
        totalCo2: co2Metrics.totalCo2,
        inputsJson: JSON.stringify(inputs),
      },
    });

    return res.status(201).json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Submit carbon log error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLogs(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const logs = await prisma.carbonLog.findMany({
      where: { userId: req.user.id },
      orderBy: { recordedAt: 'desc' },
    });

    return res.json(logs);
  } catch (error) {
    console.error('Fetch carbon logs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const logs = await prisma.carbonLog.findMany({
      where: { userId: req.user.id },
      orderBy: { recordedAt: 'asc' },
      take: 10, // last 10 entries for trends
    });

    // Calculate baseline comparison
    // Average weekly carbon footprint baseline is ~350 kg CO2 per household/individual in standard conditions
    const BASELINE_CO2 = 350.0; 
    let totalSavings = 0;
    
    logs.forEach(log => {
      if (log.totalCo2 < BASELINE_CO2) {
        totalSavings += (BASELINE_CO2 - log.totalCo2);
      }
    });

    return res.json({
      logs,
      summary: {
        totalSavings: Math.round(totalSavings * 100) / 100,
        baseline: BASELINE_CO2,
      }
    });
  } catch (error) {
    console.error('Fetch carbon analytics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function exportCSV(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const logs = await prisma.carbonLog.findMany({
      where: { userId: req.user.id },
      orderBy: { recordedAt: 'desc' },
    });

    // Generate CSV contents (ensure proper escaping of commas/newlines)
    let csvContent = 'Recorded Date,Travel CO2 (kg),Energy CO2 (kg),Diet CO2 (kg),Total CO2 (kg)\n';
    
    logs.forEach(log => {
      const dateStr = log.recordedAt.toISOString().split('T')[0];
      csvContent += `${dateStr},${log.travelCo2},${log.energyCo2},${log.dietCo2},${log.totalCo2}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=carbon-footprint-report-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
