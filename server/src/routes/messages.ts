import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

export const messagesRouter = Router();

// List conversation threads for the current user, most recent first.
messagesRouter.get('/', requireAuth, async (req, res) => {
  const profileId = req.user!.profileId;
  if (!profileId) return res.status(400).json({ error: 'No profile for this account' });

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderProfileId: profileId }, { recipientProfileId: profileId }] },
    orderBy: { sentAt: 'desc' },
  });

  const threads = new Map<string, { otherProfileId: string; lastMessage: any; unread: number }>();
  for (const m of messages) {
    const otherId = m.senderProfileId === profileId ? m.recipientProfileId : m.senderProfileId;
    if (!threads.has(otherId)) {
      threads.set(otherId, { otherProfileId: otherId, lastMessage: m, unread: 0 });
    }
    if (m.recipientProfileId === profileId && !m.readAt) {
      threads.get(otherId)!.unread += 1;
    }
  }

  const otherIds = Array.from(threads.keys());
  const profiles = await prisma.profile.findMany({ where: { id: { in: otherIds } } });
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const result = Array.from(threads.values()).map((t) => {
    const p = profileMap.get(t.otherProfileId);
    return {
      profile: p ? { id: p.id, firstName: p.firstName, lastName: p.lastName, profession: p.profession } : null,
      lastMessage: { body: t.lastMessage.body, sentAt: t.lastMessage.sentAt, fromMe: t.lastMessage.senderProfileId === profileId },
      unread: t.unread,
    };
  });

  res.json({ threads: result });
});

messagesRouter.get('/:profileId', requireAuth, async (req, res) => {
  const profileId = req.user!.profileId;
  if (!profileId) return res.status(400).json({ error: 'No profile for this account' });
  const otherId = req.params.profileId;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderProfileId: profileId, recipientProfileId: otherId },
        { senderProfileId: otherId, recipientProfileId: profileId },
      ],
    },
    orderBy: { sentAt: 'asc' },
  });

  await prisma.message.updateMany({
    where: { senderProfileId: otherId, recipientProfileId: profileId, readAt: null },
    data: { readAt: new Date() },
  });

  const otherProfile = await prisma.profile.findUnique({ where: { id: otherId } });

  res.json({
    profile: otherProfile
      ? { id: otherProfile.id, firstName: otherProfile.firstName, lastName: otherProfile.lastName, profession: otherProfile.profession }
      : null,
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      sentAt: m.sentAt,
      readAt: m.readAt,
      fromMe: m.senderProfileId === profileId,
    })),
  });
});

messagesRouter.post('/', requireAuth, async (req, res) => {
  const profileId = req.user!.profileId;
  if (!profileId) return res.status(400).json({ error: 'No profile for this account' });

  const { recipientProfileId, body } = req.body ?? {};
  if (!recipientProfileId || !body || !String(body).trim()) {
    return res.status(400).json({ error: 'recipientProfileId and body required' });
  }

  const recipient = await prisma.profile.findUnique({ where: { id: recipientProfileId } });
  if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

  const message = await prisma.message.create({
    data: { senderProfileId: profileId, recipientProfileId, body: String(body).trim() },
  });
  res.status(201).json({ id: message.id, body: message.body, sentAt: message.sentAt, fromMe: true });
});
