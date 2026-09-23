import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

export const opportunitiesRouter = Router();

opportunitiesRouter.get('/', requireAuth, async (req, res) => {
  const { type, country } = req.query as Record<string, string | undefined>;
  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (country) where.country = country;

  const opportunities = await prisma.opportunity.findMany({
    where,
    orderBy: { deadline: 'asc' },
  });
  res.json({ results: opportunities });
});

opportunitiesRouter.get('/:id', requireAuth, async (req, res) => {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opportunity) return res.status(404).json({ error: 'Not found' });
  res.json(opportunity);
});
