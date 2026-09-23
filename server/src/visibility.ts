import { Profile } from '@prisma/client';
import { Role, Visibility } from './types';

// Fields governed by fieldVisibility overrides / profile-level visibility.
// REF-verified fields (firstName, lastName, country, refProgram, cohortYear) and
// the id are always visible to any viewer who can see the profile at all —
// only the user-maintained fields below can be individually restricted.
const GOVERNED_FIELDS = [
  'profession',
  'skills',
  'bio',
  'currentLocation',
  'languages',
  'contactEmail',
  'mentorAvailable',
  'mentorCategories',
  'seekingMentor',
  'seekingCategories',
] as const;

type GovernedField = (typeof GOVERNED_FIELDS)[number];

// Required access level to view a field with a given visibility setting.
// Higher number = more restrictive. Staff/owner bypass this entirely (handled
// by the early return in filterProfileForViewer), so PRIVATE's required level
// only matters in that it is never met by an ordinary network viewer.
const REQUIRED_LEVEL: Record<Visibility, number> = {
  PUBLIC: 0,
  NETWORK_ONLY: 1,
  PRIVATE: 2,
};

// The viewer's own access level: unauthenticated visitors get the lowest
// level (can only see PUBLIC fields); any authenticated, claimed network
// member gets level 1 (can see PUBLIC and NETWORK_ONLY fields, never PRIVATE).
function viewerLevel(isAuthenticatedClaimedUser: boolean): number {
  return isAuthenticatedClaimedUser ? 1 : 0;
}

export interface ViewerContext {
  role?: Role;
  profileId?: string | null;
  isAuthenticated: boolean;
}

export type PublicProfile = {
  id: string;
  firstName: string;
  lastName: string;
  country: string;
  refProgram: string;
  cohortYear: number;
  verifiedAt: Date | null;
} & Partial<Record<GovernedField, unknown>> & {
  isOwner: boolean;
  contactVisible: boolean;
};

/**
 * The single source of truth for what a viewer is allowed to see on a profile.
 * Every endpoint returning profile data must go through this — never hand-roll
 * a visibility check in a route handler.
 */
export function filterProfileForViewer(profile: Profile, viewer: ViewerContext): PublicProfile {
  const isOwner = !!viewer.profileId && viewer.profileId === profile.id;
  const isStaff = viewer.role === 'STAFF';

  const base: PublicProfile = {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    country: profile.country,
    refProgram: profile.refProgram,
    cohortYear: profile.cohortYear,
    verifiedAt: profile.verifiedAt,
    isOwner,
    contactVisible: profile.contactVisible,
  };

  if (isOwner || isStaff) {
    for (const field of GOVERNED_FIELDS) {
      (base as any)[field] = parseFieldIfJson(field, (profile as any)[field]);
    }
    return base;
  }

  let fieldVisibility: Record<string, Visibility> = {};
  try {
    fieldVisibility = JSON.parse(profile.fieldVisibility || '{}');
  } catch {
    fieldVisibility = {};
  }

  const level = viewerLevel(viewer.isAuthenticated);

  for (const field of GOVERNED_FIELDS) {
    const fieldOverride = fieldVisibility[field];
    const effectiveVisibility: Visibility = fieldOverride ?? (profile.visibility as Visibility);
    const requiredLevel = REQUIRED_LEVEL[effectiveVisibility];
    if (level >= requiredLevel) {
      (base as any)[field] = parseFieldIfJson(field, (profile as any)[field]);
    }
  }

  // contactEmail additionally requires contactVisible to be true, on top of visibility rank.
  if ('contactEmail' in base && !profile.contactVisible) {
    delete (base as any).contactEmail;
  }

  return base;
}

const JSON_ARRAY_FIELDS = new Set(['skills', 'languages', 'mentorCategories', 'seekingCategories']);

function parseFieldIfJson(field: string, value: unknown) {
  if (JSON_ARRAY_FIELDS.has(field) && typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value;
}

/**
 * Determines whether a profile can appear at all for a given viewer and filter query
 * (e.g. searching by country should never leak existence of a profile whose country
 * field is PRIVATE for that viewer).
 */
export function isFieldVisibleToViewer(
  profile: Profile,
  field: GovernedField,
  viewer: ViewerContext
): boolean {
  const isOwner = !!viewer.profileId && viewer.profileId === profile.id;
  if (isOwner || viewer.role === 'STAFF') return true;

  let fieldVisibility: Record<string, Visibility> = {};
  try {
    fieldVisibility = JSON.parse(profile.fieldVisibility || '{}');
  } catch {
    fieldVisibility = {};
  }
  const effectiveVisibility: Visibility = fieldVisibility[field] ?? (profile.visibility as Visibility);
  const level = viewerLevel(viewer.isAuthenticated);
  return level >= REQUIRED_LEVEL[effectiveVisibility];
}
