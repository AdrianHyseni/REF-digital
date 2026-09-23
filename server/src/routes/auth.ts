import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { createSession } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !user.passwordHash || !user.isClaimed) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = await createSession(user.id);
  res.json({ token, role: user.role, email: user.email });
});

authRouter.post('/claim/lookup', async (req, res) => {
  const { claimCode } = req.body ?? {};
  if (!claimCode) return res.status(400).json({ error: 'Claim code required' });

  const user = await prisma.user.findUnique({
    where: { claimCode: String(claimCode).trim().toUpperCase() },
    include: { profile: true },
  });
  if (!user || user.isClaimed || !user.profile) {
    return res.status(404).json({ error: 'We could not find a profile for that claim code.' });
  }

  res.json({
    firstName: user.profile.firstName,
    lastName: user.profile.lastName,
    country: user.profile.country,
    refProgram: user.profile.refProgram,
    cohortYear: user.profile.cohortYear,
  });
});

authRouter.post('/claim', async (req, res) => {
  const { claimCode, password, email } = req.body ?? {};
  if (!claimCode || !password) return res.status(400).json({ error: 'Claim code and password required' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const user = await prisma.user.findUnique({
    where: { claimCode: String(claimCode).trim().toUpperCase() },
    include: { profile: true },
  });
  if (!user || user.isClaimed || !user.profile) {
    return res.status(404).json({ error: 'We could not find a profile for that claim code.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newEmail = email ? String(email).toLowerCase() : user.email;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      isClaimed: true,
      claimCode: null,
      email: newEmail,
    },
  });

  const token = await createSession(user.id);
  res.json({ token, role: user.role, email: newEmail, profileId: user.profile.id });
});

authRouter.post('/logout', async (req, res) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length);
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }
  res.json({ ok: true });
});

authRouter.get('/me', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role, profileId: req.user.profileId });
});
