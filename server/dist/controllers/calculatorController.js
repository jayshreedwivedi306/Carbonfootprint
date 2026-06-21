"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitLog = submitLog;
exports.getLogs = getLogs;
exports.getAnalytics = getAnalytics;
exports.exportCSV = exportCSV;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
const carbonService_1 = require("../services/carbonService");
const logSchema = zod_1.z.object({
    carMiles: zod_1.z.number().nonnegative(),
    vehicleType: zod_1.z.enum(['gasoline', 'hybrid', 'electric', 'none']),
    publicTransitMiles: zod_1.z.number().nonnegative(),
    flightMiles: zod_1.z.number().nonnegative(),
    electricityKwh: zod_1.z.number().nonnegative(),
    gasTherms: zod_1.z.number().nonnegative(),
    dietType: zod_1.z.enum(['meat_heavy', 'average', 'vegetarian', 'vegan']),
});
async function submitLog(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const inputs = logSchema.parse(req.body);
        const co2Metrics = carbonService_1.CarbonService.calculateWeeklyFootprint(inputs);
        const log = await db_1.default.carbonLog.create({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Submit carbon log error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getLogs(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const logs = await db_1.default.carbonLog.findMany({
            where: { userId: req.user.id },
            orderBy: { recordedAt: 'desc' },
        });
        return res.json(logs);
    }
    catch (error) {
        console.error('Fetch carbon logs error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getAnalytics(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const logs = await db_1.default.carbonLog.findMany({
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
    }
    catch (error) {
        console.error('Fetch carbon analytics error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function exportCSV(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const logs = await db_1.default.carbonLog.findMany({
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
    }
    catch (error) {
        console.error('CSV export error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
