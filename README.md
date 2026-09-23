# REF Network — MVP Prototype

An interactive prototype of the REF Network MVP: a mobile-first web app for REF alumni
(digital profile, directory, mentorship, opportunities, messaging) plus a staff admin
dashboard, running against realistic seed data.

**This is a demo, not production software.** It runs locally with a lightweight backend
and a SQLite database — there is no cloud deployment, no real email delivery, and no
production authentication. See "Out of scope" in the companion proposal documents for
what was deliberately left out.

## Tech stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS, React Query for data fetching
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite via Prisma (schema is written to map cleanly to Postgres later)
- **Auth:** Email + password with a simulated claim-code invite flow (no real email sending)

## Project structure

```
ref-network-mvp/
├── server/            # Express API, Prisma schema + seed script
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── routes/        # one file per resource
│       ├── middleware/    # auth
│       ├── visibility.ts  # the single shared profile-visibility filter
│       └── index.ts
└── web/                # React app (person-facing app + staff admin dashboard)
    └── src/
        ├── app/            # person-facing routes
        ├── admin/          # staff dashboard routes
        ├── components/     # shared UI
        └── lib/            # API client, auth context, types
```

`server` and `web` are separate npm workspaces, run together with one command.

## Setup

Requires Node.js 18+.

```bash
# 1. Install dependencies for both workspaces
npm install

# 2. Set up the database and load seed data
cd server
npx prisma migrate dev
npm run seed
cd ..

# 3. Run both the API and the web app together
npm run dev
```

The web app runs at **http://localhost:5173** and proxies `/api` requests to the
Express server at **http://localhost:4000**. The SQLite database lives at
`server/prisma/dev.db` and persists across restarts — stop and restart `npm run dev`
and your data (edited profiles, sent messages, mentorship requests, posted
opportunities) will still be there.

To reset the database back to the original seed data at any point:

```bash
cd server
npm run seed
```

## Demo logins

| Role | Email | Password |
|---|---|---|
| Alumnus (pre-claimed, mentor + mentee) | `demo.alumnus@example.org` | `demo1234` |
| Staff (Romania) | `staff.romania@ref.org` | `demo1234` |
| Staff (Kosovo) | `staff.kosovo@ref.org` | `demo1234` |

30 of the 40 seeded alumni profiles are already claimed (email pattern
`firstname.lastname@example.org`, password `demo1234` for all of them). The remaining
10 are **unclaimed** — to demo the claim flow, log in as staff, open **Users**, filter
by "Unclaimed", and copy any claim code shown in that row. Then log out and use
"I have a claim code" on the login screen with that code.

## What to click through

1. **Claim flow** — log in as staff, grab an unclaimed user's claim code from the Users
   table, log out, and use "I have a claim code" to see the "Is this you?" moment and
   finish profile setup.
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
- Out of scope for this prototype: organization profiles, partner content syndication,
  events lifecycle, Research & Knowledge Hub, Alumni Stories, AI/semantic matching,
  legacy data migration, and real cloud deployment/CI/SSO. See the companion proposal
  documents for the full list.
