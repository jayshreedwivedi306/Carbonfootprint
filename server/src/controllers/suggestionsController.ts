import { Response } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getSuggestions(req: AuthenticatedRequest, res: Response) {
  try {
    const suggestions = await prisma.suggestion.findMany();
    return res.json(suggestions);
  } catch (error) {
    console.error('Fetch suggestions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adoptSuggestion(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { suggestionId } = req.body;
    if (!suggestionId) {
      return res.status(400).json({ error: 'Suggestion ID is required' });
    }

    // Check if suggestion exists
    const suggestion = await prisma.suggestion.findUnique({
      where: { id: suggestionId },
    });
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    // Adopt (use upsert to handle re-activation of an unadopted suggestion or idempotency)
    const adopted = await prisma.adoptedSuggestion.upsert({
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
  } catch (error) {
    console.error('Adopt suggestion error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAdoptedSuggestions(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const adopted = await prisma.adoptedSuggestion.findMany({
      where: { userId: req.user.id },
      include: {
        suggestion: true,
      },
    });

    return res.json(adopted);
  } catch (error) {
    console.error('Fetch adopted suggestions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function completeSuggestion(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const record = await prisma.adoptedSuggestion.findUnique({
      where: { id },
    });

    if (!record || record.userId !== req.user.id) {
      return res.status(404).json({ error: 'Adopted suggestion record not found' });
    }

    const updated = await prisma.adoptedSuggestion.update({
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
  } catch (error) {
    console.error('Complete suggestion error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteAdoptedSuggestion(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const record = await prisma.adoptedSuggestion.findUnique({
      where: { id },
    });

    if (!record || record.userId !== req.user.id) {
      return res.status(404).json({ error: 'Adopted suggestion record not found' });
    }

    await prisma.adoptedSuggestion.delete({
      where: { id },
    });

    return res.json({ message: 'Suggestion unadopted successfully' });
  } catch (error) {
    console.error('Delete adopted suggestion error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
