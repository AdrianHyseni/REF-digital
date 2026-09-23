import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { AuthedUser } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string): Promise<string> {
  const token = cryptoRandomToken();
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

function cryptoRandomToken(): string {
  return [...Array(32)]
    .map(() => Math.floor(Math.random() * 36).toString(36))
    .join('');
}

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  const token = header.slice('Bearer '.length);
  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return next();
  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { profile: true } });
  if (!user) return next();
  req.user = {
    id: user.id,
    email: user.email,
    role: user.role as any,
    profileId: user.profile?.id ?? null,
  };
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

export function requireStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'STAFF') return res.status(403).json({ error: 'Staff access required' });
  next();
}
