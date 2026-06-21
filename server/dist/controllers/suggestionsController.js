"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestions = getSuggestions;
exports.adoptSuggestion = adoptSuggestion;
exports.getAdoptedSuggestions = getAdoptedSuggestions;
exports.completeSuggestion = completeSuggestion;
exports.deleteAdoptedSuggestion = deleteAdoptedSuggestion;
const db_1 = __importDefault(require("../db"));
async function getSuggestions(req, res) {
    try {
        const suggestions = await db_1.default.suggestion.findMany();
        return res.json(suggestions);
    }
    catch (error) {
        console.error('Fetch suggestions error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function adoptSuggestion(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { suggestionId } = req.body;
        if (!suggestionId) {
            return res.status(400).json({ error: 'Suggestion ID is required' });
        }
        // Check if suggestion exists
        const suggestion = await db_1.default.suggestion.findUnique({
            where: { id: suggestionId },
        });
        if (!suggestion) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }
        // Adopt (use upsert to handle re-activation of an unadopted suggestion or idempotency)
        const adopted = await db_1.default.adoptedSuggestion.upsert({
            where: {
                userId_suggestionId: {
                    userId: req.user.id,
                    suggestionId,
                },
            },
            create: {
                userId: req.user.id,
                suggestionId,
                status: 'ACTIVE',
            },
            update: {
                status: 'ACTIVE',
                completedAt: null,
            },
            include: {
                suggestion: true,
            },
        });
        return res.status(201).json(adopted);
    }
    catch (error) {
        console.error('Adopt suggestion error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getAdoptedSuggestions(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const adopted = await db_1.default.adoptedSuggestion.findMany({
            where: { userId: req.user.id },
            include: {
                suggestion: true,
            },
        });
        return res.json(adopted);
    }
    catch (error) {
        console.error('Fetch adopted suggestions error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function completeSuggestion(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const record = await db_1.default.adoptedSuggestion.findUnique({
            where: { id },
        });
        if (!record || record.userId !== req.user.id) {
            return res.status(404).json({ error: 'Adopted suggestion record not found' });
        }
        const updated = await db_1.default.adoptedSuggestion.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
            include: {
                suggestion: true,
            },
        });
        return res.json(updated);
    }
    catch (error) {
        console.error('Complete suggestion error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteAdoptedSuggestion(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const record = await db_1.default.adoptedSuggestion.findUnique({
            where: { id },
        });
        if (!record || record.userId !== req.user.id) {
            return res.status(404).json({ error: 'Adopted suggestion record not found' });
        }
        await db_1.default.adoptedSuggestion.delete({
            where: { id },
        });
        return res.json({ message: 'Suggestion unadopted successfully' });
    }
    catch (error) {
        console.error('Delete adopted suggestion error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
