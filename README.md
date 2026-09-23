# REF Network — MVP Prototype

An interactive prototype of the REF Network MVP: a mobile-first web app for REF alumni
(digital profile, directory, mentorship, opportunities, messaging) plus a separate staff
admin dashboard, running against realistic seed data.

**This is a demo, not production software.** There is no real email delivery and no
production-grade authentication (OAuth/SSO). See "Out of scope" in the companion
proposal documents for what was deliberately left out.

## Tech stack

- **Frontend:** two separate React + TypeScript + Vite + Tailwind apps — `web` (the
  person-facing alumni app) and `admin` (the staff dashboard) — each its own deployable
  project, talking to the same API
- **Backend:** Node.js + Express + TypeScript, one shared API for both frontends
- **Database:** PostgreSQL via Prisma
- **Auth:** Email + password with a simulated claim-code invite flow (no real email
  sending). The API doesn't segregate by app — `admin` simply refuses to log in anyone
  who isn't `STAFF`, and `web` refuses anyone who is
- **Infra:** Docker Compose (Postgres + api + web + admin), or run everything directly
  with Node for local development

## Project structure

```
ref-network-mvp/
├── server/            # Express API, Prisma schema + seed script (shared by both apps)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── routes/        # one file per resource
│   │   ├── middleware/    # auth
│   │   ├── visibility.ts  # the single shared profile-visibility filter
│   │   └── index.ts
│   └── Dockerfile
├── web/                # Person-facing alumni app (its own deployable project)
│   ├── src/
│   │   ├── app/            # onboarding, profile, directory, mentorship, opportunities, messages
│   │   ├── components/, lib/
│   └── Dockerfile
├── admin/              # Staff dashboard (its own deployable project)
│   ├── src/
│   │   ├── app/            # users, content (opportunities), analytics
│   │   ├── components/, lib/
│   └── Dockerfile
└── docker-compose.yml
```

`server`, `web` and `admin` are three separate npm workspaces sharing one root
lockfile, each independently buildable/deployable (own `package.json`, own
Dockerfile). `web` and `admin` share no code at the module level by design — they're
meant to be separate projects, so a few small files (`lib/api.ts`, `components/ui.tsx`,
etc.) are intentionally duplicated rather than pulled from a shared package.

## Running it with Docker (recommended)

Requires Docker with Compose.

```bash
docker compose up --build
```

This starts four containers:

| Service | URL | What it is |
|---|---|---|
| `postgres` | — | Database (data persists in a named volume) |
| `api` | http://localhost:4000 | Express API |
| `web` | http://localhost:5173 | Alumni app |
| `admin` | http://localhost:5174 | Staff dashboard |

On first boot, `api` runs `prisma migrate deploy` and then seeds the database — but
**only if it's empty**, so restarting the stack (`docker compose up` again, or a
container restart) never wipes out data you've added during a demo. To force a full
reset back to the original seed data at any point:

```bash
docker compose exec api npm run seed
```

To stop everything (data persists in the `postgres-data` volume):

```bash
docker compose down
```

To wipe the database too:

```bash
docker compose down -v
```

## Running it without Docker

Requires Node.js 18+ and a local PostgreSQL instance.

```bash
# 1. Install dependencies for all three workspaces
npm install

# 2. Point the API at your Postgres instance
cp server/.env.example server/.env
# edit server/.env if your Postgres isn't at the default local connection string

# 3. Set up the database and load seed data
cd server
npx prisma migrate deploy
npm run seed
cd ..

# 4. Run the API, web app and admin dashboard together
npm run dev
```

- Alumni app: **http://localhost:5173**
- Staff dashboard: **http://localhost:5174**
- API: **http://localhost:4000**

Both frontends' dev servers proxy `/api` requests to the Express server, so no extra
env vars are needed for local dev. (In a production/Docker build, each frontend is a
static build with `VITE_API_URL` baked in at build time, since there's no dev proxy
once it's just static files behind nginx.)

## Demo logins

| Role | Email | Password | Log in at |
|---|---|---|---|
| Alumnus (pre-claimed, mentor + mentee) | `demo.alumnus@example.org` | `demo1234` | web app |
| Staff (Romania) | `staff.romania@ref.org` | `demo1234` | admin dashboard |
| Staff (Kosovo) | `staff.kosovo@ref.org` | `demo1234` | admin dashboard |

30 of the 40 seeded alumni profiles are already claimed (email pattern
`firstname.lastname@example.org`, password `demo1234` for all of them). The remaining
10 are **unclaimed** — to demo the claim flow, log in to the admin dashboard, open
**Users**, filter by "Unclaimed", and copy any claim code shown in that row. Then use
"I have a claim code" on the alumni app's login screen with that code.

## What to click through

1. **Claim flow** — log in to the admin dashboard, grab an unclaimed user's claim code
   from the Users table, then use "I have a claim code" on the alumni app to see the
   "Is this you?" moment and finish profile setup.
2. **Directory & visibility** — log in as `demo.alumnus@example.org`. Their profile has
   a mix of visibility settings (skills visible to the network, current location and
   contact email private) — view it as a different alumnus to see the difference. Try
   searching the directory by name, profession, or skill, and filtering by country or
   "Mentors only".
3. **Mentorship** — from another alumnus's profile (if they're flagged as a mentor),
   request mentorship; log in as that mentor to accept it from the Requests tab.
   `demo.alumnus` already has one incoming mentorship request waiting.
4. **Messaging** — message someone from their profile, or continue `demo.alumnus`'s
   existing conversation from the Messages tab.
5. **Opportunities** — browse and filter the 15 seeded scholarships, jobs, internships,
   trainings, grants and events.
6. **Admin dashboard** — log in as staff. Verify an unverified user's REF-verified
   fields, post a new opportunity, and check the Analytics page (sign-ups, claim rate,
   profile completion, active mentor pairs, directory searches).

## Notes on scope

- Visibility rules are enforced through one shared server-side function
  (`server/src/visibility.ts`), used by every endpoint that returns profile data — not
  duplicated per-route.
- Analytics numbers (sign-ups, claim rate, directory search count, etc.) are computed
  from real data in the database, not hardcoded.
- `admin` and `web` hit the same API and enforce their staff-only / alumni-only login
  restriction client-side for UX (a clear error message pointing you to the right app)
  — the real authorization boundary is server-side (`requireStaff` middleware on every
  `/api/admin/*` route), so this isn't relied on for security.
- Out of scope for this prototype: organization profiles, partner content syndication,
  events lifecycle, Research & Knowledge Hub, Alumni Stories, AI/semantic matching,
  legacy data migration, real CI/CD, and production SSO. See the companion proposal
  documents for the full list.
