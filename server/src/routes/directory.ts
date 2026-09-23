import { Router } from 'express';
import { prisma } from '../prisma';
import { attachUser } from '../middleware/auth';
import { filterProfileForViewer, ViewerContext } from '../visibility';

export const directoryRouter = Router();

function viewerContextFrom(req: any): ViewerContext {
  return {
    role: req.user?.role,
    profileId: req.user?.profileId ?? null,
    isAuthenticated: !!req.user,
  };
}

directoryRouter.get('/', async (req, res) => {
  // Directory browsing requires being an authenticated, claimed user (network member).
  if (!req.user) return res.status(401).json({ error: 'Please log in to browse the directory' });

  const { profession, country, skill, mentorAvailable, q } = req.query as Record<string, string | undefined>;

  await prisma.directorySearchEvent.create({ data: {} });

  const profiles = await prisma.profile.findMany({ orderBy: { lastName: 'asc' } });
  const viewer = viewerContextFrom(req);

  const results = profiles
    .map((p) => filterProfileForViewer(p, viewer))
    .filter((p) => {
      // Never let a filter match on a field the viewer isn't allowed to see;
      // profiles for which the field is hidden simply fall out of that filter's results.
      if (country && p.country?.toLowerCase() !== country.toLowerCase()) return false;
      if (profession) {
        if (typeof p.profession !== 'string') return false;
        if (!p.profession.toLowerCase().includes(profession.toLowerCase())) return false;
      }
      if (skill) {
        if (!Array.isArray(p.skills)) return false;
        if (!(p.skills as string[]).some((s) => s.toLowerCase().includes(skill.toLowerCase()))) return false;
      }
      if (mentorAvailable === 'true') {
        if (p.mentorAvailable !== true) return false;
      }
      if (q) {
        const needle = q.toLowerCase();
        const name = `${p.firstName} ${p.lastName}`.toLowerCase();
        const professionMatch = typeof p.profession === 'string' && p.profession.toLowerCase().includes(needle);
        const skillMatch = Array.isArray(p.skills) && (p.skills as string[]).some((s) => s.toLowerCase().includes(needle));
        if (!name.includes(needle) && !professionMatch && !skillMatch) return false;
      }
      return true;
    })
    .map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      country: p.country,
      profession: p.profession ?? null,
      currentLocation: p.currentLocation ?? null,
      mentorAvailable: p.mentorAvailable ?? false,
      seekingMentor: p.seekingMentor ?? false,
    }));

  res.json({ results, total: results.length });
});

directoryRouter.get('/:profileId', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Please log in to view profiles' });

  const profile = await prisma.profile.findUnique({ where: { id: req.params.profileId } });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const filtered = filterProfileForViewer(profile, viewerContextFrom(req));
  res.json(filtered);
});
