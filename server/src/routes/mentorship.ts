import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

export const mentorshipRouter = Router();

function serialize(conn: any, profiles: Record<string, any>) {
  return {
    id: conn.id,
    category: conn.category,
    status: conn.status,
    createdAt: conn.createdAt,
    mentor: profiles[conn.mentorProfileId],
    mentee: profiles[conn.menteeProfileId],
  };
}

async function loadProfilesById(ids: string[]) {
  const profiles = await prisma.profile.findMany({ where: { id: { in: ids } } });
  const map: Record<string, any> = {};
  for (const p of profiles) {
    map[p.id] = { id: p.id, firstName: p.firstName, lastName: p.lastName, profession: p.profession };
  }
  return map;
}

mentorshipRouter.get('/', requireAuth, async (req, res) => {
  const profileId = req.user!.profileId;
  if (!profileId) return res.status(400).json({ error: 'No profile for this account' });

  const connections = await prisma.mentorshipConnection.findMany({
    where: {
      OR: [{ mentorProfileId: profileId }, { menteeProfileId: profileId }],
    },
    orderBy: { createdAt: 'desc' },
  });

  const ids = Array.from(new Set(connections.flatMap((c) => [c.mentorProfileId, c.menteeProfileId])));
  const profiles = await loadProfilesById(ids);

  const accepted = connections.filter((c) => c.status === 'ACCEPTED');
  const requestsIncoming = connections.filter((c) => c.status === 'REQUESTED' && c.mentorProfileId === profileId);
  const requestsOutgoing = connections.filter((c) => c.status === 'REQUESTED' && c.menteeProfileId === profileId);
  const declined = connections.filter((c) => c.status === 'DECLINED');

  res.json({
    accepted: accepted.map((c) => serialize(c, profiles)),
    requestsIncoming: requestsIncoming.map((c) => serialize(c, profiles)),
    requestsOutgoing: requestsOutgoing.map((c) => serialize(c, profiles)),
    declined: declined.map((c) => serialize(c, profiles)),
  });
});

mentorshipRouter.post('/request', requireAuth, async (req, res) => {
  const profileId = req.user!.profileId;
  if (!profileId) return res.status(400).json({ error: 'No profile for this account' });

  const { mentorProfileId, category } = req.body ?? {};
  if (!mentorProfileId || !category) return res.status(400).json({ error: 'mentorProfileId and category required' });
  if (mentorProfileId === profileId) return res.status(400).json({ error: 'Cannot request mentorship from yourself' });

  const mentor = await prisma.profile.findUnique({ where: { id: mentorProfileId } });
  if (!mentor || !mentor.mentorAvailable) return res.status(404).json({ error: 'Mentor not available' });

  const existing = await prisma.mentorshipConnection.findFirst({
    where: { mentorProfileId, menteeProfileId: profileId, status: { in: ['REQUESTED', 'ACCEPTED'] } },
  });
  if (existing) return res.status(409).json({ error: 'A request already exists with this mentor' });

  const connection = await prisma.mentorshipConnection.create({
    data: { mentorProfileId, menteeProfileId: profileId, category, status: 'REQUESTED' },
  });
  const profiles = await loadProfilesById([mentorProfileId, profileId]);
  res.status(201).json(serialize(connection, profiles));
});

mentorshipRouter.patch('/:id', requireAuth, async (req, res) => {
  const profileId = req.user!.profileId;
  if (!profileId) return res.status(400).json({ error: 'No profile for this account' });

  const { status } = req.body ?? {};
  if (!['ACCEPTED', 'DECLINED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const connection = await prisma.mentorshipConnection.findUnique({ where: { id: req.params.id } });
  if (!connection) return res.status(404).json({ error: 'Not found' });
  if (connection.mentorProfileId !== profileId) {
    return res.status(403).json({ error: 'Only the mentor can accept or decline this request' });
  }

  const updated = await prisma.mentorshipConnection.update({ where: { id: connection.id }, data: { status } });
  const profiles = await loadProfilesById([updated.mentorProfileId, updated.menteeProfileId]);
  res.json(serialize(updated, profiles));
});
