import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { filterProfileForViewer } from '../visibility';

export const profilesRouter = Router();

profilesRouter.get('/me', requireAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  const filtered = filterProfileForViewer(profile, {
    role: req.user!.role,
    profileId: req.user!.profileId,
    isAuthenticated: true,
  });
  res.json(filtered);
});

const EDITABLE_FIELDS = [
  'profession',
  'bio',
  'currentLocation',
  'contactEmail',
  'contactVisible',
  'mentorAvailable',
  'seekingMentor',
  'visibility',
] as const;

const EDITABLE_ARRAY_FIELDS = ['skills', 'languages', 'mentorCategories', 'seekingCategories'] as const;

profilesRouter.patch('/me', requireAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const body = req.body ?? {};
  const data: Record<string, unknown> = {};

  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }
  for (const field of EDITABLE_ARRAY_FIELDS) {
    if (field in body && Array.isArray(body[field])) {
      data[field] = JSON.stringify(body[field]);
    }
  }
  if ('fieldVisibility' in body && typeof body.fieldVisibility === 'object') {
    data.fieldVisibility = JSON.stringify(body.fieldVisibility);
  }

  const updated = await prisma.profile.update({ where: { id: profile.id }, data });
  const filtered = filterProfileForViewer(updated, {
    role: req.user!.role,
    profileId: req.user!.profileId,
    isAuthenticated: true,
  });
  res.json(filtered);
});
