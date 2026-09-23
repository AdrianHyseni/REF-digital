import { Router } from 'express';
import { prisma } from '../prisma';
import { requireStaff } from '../middleware/auth';

export const adminRouter = Router();
adminRouter.use(requireStaff);

function profileCompletion(profile: any): number {
  const fields = ['profession', 'bio', 'currentLocation', 'contactEmail'];
  const arrayFields = ['skills', 'languages'];
  let filled = 0;
  const total = fields.length + arrayFields.length;
  for (const f of fields) if (profile?.[f]) filled += 1;
  for (const f of arrayFields) {
    try {
      if (JSON.parse(profile?.[f] || '[]').length > 0) filled += 1;
    } catch {
      // ignore
    }
  }
  return Math.round((filled / total) * 100);
}

adminRouter.get('/users', async (req, res) => {
  const { country, status, search } = req.query as Record<string, string | undefined>;

  const users = await prisma.user.findMany({
    where: { role: 'ALUMNUS' },
    include: { profile: true },
    orderBy: { createdAt: 'desc' },
  });

  let results = users.map((u) => ({
    id: u.id,
    email: u.email,
    isClaimed: u.isClaimed,
    claimCode: u.claimCode,
    createdAt: u.createdAt,
    profile: u.profile
      ? {
          id: u.profile.id,
          firstName: u.profile.firstName,
          lastName: u.profile.lastName,
          country: u.profile.country,
          refProgram: u.profile.refProgram,
          cohortYear: u.profile.cohortYear,
          verifiedAt: u.profile.verifiedAt,
          mentorAvailable: u.profile.mentorAvailable,
          completion: profileCompletion(u.profile),
        }
      : null,
  }));

  if (country) results = results.filter((r) => r.profile?.country === country);
  if (status === 'claimed') results = results.filter((r) => r.isClaimed);
  if (status === 'unclaimed') results = results.filter((r) => !r.isClaimed);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        `${r.profile?.firstName ?? ''} ${r.profile?.lastName ?? ''}`.toLowerCase().includes(q)
    );
  }

  res.json({ results });
});

adminRouter.get('/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { profile: true } });
  if (!user) return res.status(404).json({ error: 'Not found' });

  const auditLogs = await prisma.auditLog.findMany({
    where: { targetUserId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { staffUser: true },
  });

  res.json({
    id: user.id,
    email: user.email,
    isClaimed: user.isClaimed,
    claimCode: user.claimCode,
    createdAt: user.createdAt,
    profile: user.profile,
    auditLogs: auditLogs.map((a) => ({
      id: a.id,
      action: a.action,
      details: a.details,
      createdAt: a.createdAt,
      staffEmail: a.staffUser.email,
    })),
  });
});

const STAFF_EDITABLE_VERIFIED_FIELDS = ['firstName', 'lastName', 'country', 'refProgram', 'cohortYear'] as const;

adminRouter.patch('/users/:id/verify', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { profile: true } });
  if (!user || !user.profile) return res.status(404).json({ error: 'Not found' });

  const body = req.body ?? {};
  const data: Record<string, unknown> = {};
  for (const field of STAFF_EDITABLE_VERIFIED_FIELDS) {
    if (field in body) data[field] = field === 'cohortYear' ? Number(body[field]) : body[field];
  }
  data.verifiedAt = new Date();

  const updated = await prisma.profile.update({ where: { id: user.profile.id }, data });

  await prisma.auditLog.create({
    data: {
      staffUserId: req.user!.id,
      action: 'VERIFY_PROFILE',
      targetUserId: user.id,
      details: `Verified REF record for ${updated.firstName} ${updated.lastName}`,
    },
  });

  res.json(updated);
});

adminRouter.get('/opportunities', async (_req, res) => {
  const opportunities = await prisma.opportunity.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ results: opportunities });
});

adminRouter.post('/opportunities', async (req, res) => {
  const { title, description, type, country, deadline, url } = req.body ?? {};
  if (!title || !description || !type || !country || !deadline) {
    return res.status(400).json({ error: 'title, description, type, country, deadline required' });
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      title,
      description,
      type,
      country,
      deadline: new Date(deadline),
      url: url || null,
      postedByStaffId: req.user!.id,
    },
  });
  res.status(201).json(opportunity);
});

adminRouter.patch('/opportunities/:id', async (req, res) => {
  const { title, description, type, country, deadline, url } = req.body ?? {};
  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (type !== undefined) data.type = type;
  if (country !== undefined) data.country = country;
  if (deadline !== undefined) data.deadline = new Date(deadline);
  if (url !== undefined) data.url = url;

  const opportunity = await prisma.opportunity.update({ where: { id: req.params.id }, data });
  res.json(opportunity);
});

adminRouter.delete('/opportunities/:id', async (req, res) => {
  await prisma.opportunity.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

adminRouter.get('/analytics', async (_req, res) => {
  const totalUsers = await prisma.user.count({ where: { role: 'ALUMNUS' } });
  const claimedUsers = await prisma.user.count({ where: { role: 'ALUMNUS', isClaimed: true } });
  const profiles = await prisma.profile.findMany();
  const avgCompletion =
    profiles.length > 0 ? Math.round(profiles.reduce((sum, p) => sum + profileCompletion(p), 0) / profiles.length) : 0;

  const activeMentorPairs = await prisma.mentorshipConnection.count({ where: { status: 'ACCEPTED' } });
  const directorySearchCount = await prisma.directorySearchEvent.count();

  // Sign-ups over time (by createdAt date), last 90 days.
  const users = await prisma.user.findMany({ where: { role: 'ALUMNUS' }, select: { createdAt: true } });
  const byDate = new Map<string, number>();
  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + 1);
  }
  const signupsOverTime = Array.from(byDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    totalUsers,
    claimedUsers,
    claimRate: totalUsers > 0 ? Math.round((claimedUsers / totalUsers) * 100) : 0,
    avgProfileCompletion: avgCompletion,
    activeMentorPairs,
    directorySearchCount,
    signupsOverTime,
  });
});
