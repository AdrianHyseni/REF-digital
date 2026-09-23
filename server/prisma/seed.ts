import { PrismaClient } from '@prisma/client';

const Role = { ALUMNUS: 'ALUMNUS', STAFF: 'STAFF' } as const;
const Visibility = { PRIVATE: 'PRIVATE', NETWORK_ONLY: 'NETWORK_ONLY', PUBLIC: 'PUBLIC' } as const;
const OpportunityType = {
  SCHOLARSHIP: 'SCHOLARSHIP',
  JOB: 'JOB',
  INTERNSHIP: 'INTERNSHIP',
  TRAINING: 'TRAINING',
  GRANT: 'GRANT',
  EVENT: 'EVENT',
  OTHER: 'OTHER',
} as const;
const MentorshipStatus = { REQUESTED: 'REQUESTED', ACCEPTED: 'ACCEPTED', DECLINED: 'DECLINED' } as const;
type OpportunityType = (typeof OpportunityType)[keyof typeof OpportunityType];
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const COUNTRIES = ['Albania', 'Romania', 'Serbia', 'North Macedonia', 'Bulgaria', 'Slovakia', 'Kosovo'];

const CITIES: Record<string, string[]> = {
  Albania: ['Tirana', 'Shkodër', 'Durrës'],
  Romania: ['Bucharest', 'Cluj-Napoca', 'Timișoara'],
  Serbia: ['Belgrade', 'Novi Sad', 'Niš'],
  'North Macedonia': ['Skopje', 'Bitola', 'Tetovo'],
  Bulgaria: ['Sofia', 'Plovdiv', 'Varna'],
  Slovakia: ['Bratislava', 'Košice', 'Prešov'],
  Kosovo: ['Pristina', 'Prizren', 'Peja'],
};

const PROGRAMS = [
  'Roma Memorial University Scholarship Program (RMUSP)',
  'Roma Leadership Program (RLP)',
  'Roma Health Scholars Program',
  'Roma Graduate Program',
  "Centre for Innovation Fellowship",
  'Roma Teaching Assistant Program',
];

const PROFESSIONS = [
  'Primary School Teacher',
  'Software Developer',
  'Registered Nurse',
  'Entrepreneur',
  'Social Worker',
  'Journalist',
  'Civil Servant',
  'Community Organizer',
  'Lawyer',
  'Public Health Officer',
];

const SKILLS_POOL = [
  'Project Management',
  'Public Speaking',
  'Grant Writing',
  'Community Outreach',
  'Data Analysis',
  'Curriculum Design',
  'Web Development',
  'Advocacy',
  'Fundraising',
  'Policy Research',
  'Translation (Romani)',
  'Facilitation',
  'Mentoring',
  'Event Planning',
];

const LANGUAGES_POOL = ['Romani', 'English', 'Albanian', 'Romanian', 'Serbian', 'Macedonian', 'Bulgarian', 'Slovak'];

const MENTOR_CATEGORIES = ['Education', 'Career', 'Technology', 'Entrepreneurship', 'Leadership'];

const FIRST_NAMES = [
  'Elira', 'Andrei', 'Milena', 'Besnik', 'Ionela', 'Zoran', 'Ardita', 'Cristian', 'Snezhana', 'Driton',
  'Georgeta', 'Vasil', 'Fatmire', 'Mihai', 'Jelena', 'Arben', 'Alexandra', 'Nikola', 'Valentina', 'Lorik',
  'Simona', 'Radu', 'Biljana', 'Kastriot', 'Denisa', 'Petar', 'Lindita', 'Ciprian', 'Marija', 'Blerim',
  'Oana', 'Dušan', 'Sabina', 'Florin', 'Tamara', 'Enver', 'Gabriela', 'Stefan', 'Anisa', 'Vlad',
];

const LAST_NAMES = [
  'Berisha', 'Popescu', 'Jovanović', 'Krasniqi', 'Ionescu', 'Stanković', 'Hoxha', 'Dumitrescu', 'Petrov', 'Gashi',
  'Marinescu', 'Nikolić', 'Shabani', 'Constantin', 'Ristić', 'Kelmendi', 'Georgescu', 'Todorov', 'Bajrami', 'Stoica',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const BIO_TEMPLATES = [
  (name: string, prof: string, country: string) =>
    `${name} works as a ${prof.toLowerCase()} in ${country} and is passionate about giving back to the Roma community that supported their education. Outside of work, they volunteer with local youth mentoring initiatives.`,
  (name: string, prof: string, country: string) =>
    `After completing their REF-supported studies, ${name} returned to ${country} to build a career as a ${prof.toLowerCase()}. They are especially interested in connecting with other alumni working on education access.`,
  (name: string, prof: string, country: string) =>
    `${name} is a ${prof.toLowerCase()} based in ${country}, focused on expanding opportunities for Roma youth. They credit their REF scholarship with opening the door to their current career.`,
  (name: string, prof: string, country: string) =>
    `Currently a ${prof.toLowerCase()}, ${name} splits their time between their day job and community advocacy work in ${country}. They are always happy to talk to younger alumni about career paths.`,
];

async function main() {
  console.log('Seeding database...');

  await prisma.message.deleteMany();
  await prisma.mentorshipConnection.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // --- Staff accounts ---
  const staff1 = await prisma.user.create({
    data: {
      email: 'staff.romania@ref.org',
      passwordHash: await bcrypt.hash('demo1234', 10),
      role: Role.STAFF,
      isClaimed: true,
    },
  });
  const staff2 = await prisma.user.create({
    data: {
      email: 'staff.kosovo@ref.org',
      passwordHash: await bcrypt.hash('demo1234', 10),
      role: Role.STAFF,
      isClaimed: true,
    },
  });

  // --- Alumni profiles ---
  type SeedProfile = {
    user: any;
    profile: any;
  };
  const seeded: SeedProfile[] = [];

  const usedNames = new Set<string>();
  const TOTAL = 40;
  const mentorIdxs = new Set(pickN(Array.from({ length: TOTAL }, (_, i) => i), 10));
  const seekingIdxs = new Set(pickN(Array.from({ length: TOTAL }, (_, i) => i).filter((i) => !mentorIdxs.has(i)), 8));

  for (let i = 0; i < TOTAL; i++) {
    let firstName = pick(FIRST_NAMES);
    let lastName = pick(LAST_NAMES);
    let key = `${firstName}-${lastName}`;
    while (usedNames.has(key)) {
      firstName = pick(FIRST_NAMES);
      lastName = pick(LAST_NAMES);
      key = `${firstName}-${lastName}`;
    }
    usedNames.add(key);

    const country = COUNTRIES[i % COUNTRIES.length];
    const city = pick(CITIES[country]);
    const profession = pick(PROFESSIONS);
    const program = `${pick(PROGRAMS)} ${randInt(2010, 2021)}`;
    const cohortYear = randInt(2010, 2021);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.org`;

    // First 30 are claimed with password; last 10 stay unclaimed with a claim code.
    const isClaimed = i < 30;

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randInt(0, 75));

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: isClaimed ? await bcrypt.hash('demo1234', 10) : null,
        role: Role.ALUMNUS,
        isClaimed,
        claimCode: isClaimed ? null : `REF-${randomUUID().slice(0, 8).toUpperCase()}`,
        createdAt,
      },
    });

    const isMentor = mentorIdxs.has(i);
    const isSeeking = seekingIdxs.has(i);
    const bioFn = pick(BIO_TEMPLATES);

    // Unclaimed profiles only have REF-verified fields, no bio/skills yet.
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        country,
        refProgram: program,
        cohortYear,
        verifiedAt: new Date(),
        profession: isClaimed ? profession : null,
        skills: isClaimed ? JSON.stringify(pickN(SKILLS_POOL, randInt(3, 5))) : '[]',
        bio: isClaimed ? bioFn(firstName, profession, country) : null,
        currentLocation: isClaimed ? `${city}, ${country}` : null,
        languages: isClaimed ? JSON.stringify(['Romani', 'English', ...pickN(LANGUAGES_POOL, 1)]) : '[]',
        contactEmail: isClaimed ? email : null,
        contactVisible: isClaimed ? Math.random() > 0.5 : false,
        mentorAvailable: isClaimed && isMentor,
        mentorCategories: isMentor ? JSON.stringify(pickN(MENTOR_CATEGORIES, randInt(1, 2))) : '[]',
        seekingMentor: isClaimed && isSeeking,
        seekingCategories: isSeeking ? JSON.stringify(pickN(MENTOR_CATEGORIES, randInt(1, 2))) : '[]',
        visibility: Visibility.NETWORK_ONLY,
      },
    });

    seeded.push({ user, profile });
  }

  // Demo talking-point profile with mixed field visibility: skills public within network,
  // current employer (currentLocation) private.
  const demoProfile = seeded[0];
  await prisma.profile.update({
    where: { id: demoProfile.profile.id },
    data: {
      fieldVisibility: JSON.stringify({
        skills: 'NETWORK_ONLY',
        currentLocation: 'PRIVATE',
        contactEmail: 'PRIVATE',
      }),
    },
  });

  // Make sure demoProfile is clearly a mentor for the demo login flows.
  await prisma.user.update({
    where: { id: demoProfile.user.id },
    data: { email: 'demo.alumnus@example.org' },
  });
  await prisma.profile.update({
    where: { id: demoProfile.profile.id },
    data: {
      mentorAvailable: true,
      mentorCategories: JSON.stringify(['Career', 'Technology']),
    },
  });

  // --- Opportunities ---
  const opTypes: OpportunityType[] = [
    OpportunityType.SCHOLARSHIP,
    OpportunityType.JOB,
    OpportunityType.INTERNSHIP,
    OpportunityType.TRAINING,
    OpportunityType.GRANT,
    OpportunityType.EVENT,
  ];

  const opportunityTitles: { title: string; type: OpportunityType; description: string }[] = [
    { title: 'REF Graduate Scholarship 2027', type: OpportunityType.SCHOLARSHIP, description: 'Full scholarship for Roma students pursuing a master\'s degree in any EU country, covering tuition, housing and a monthly stipend.' },
    { title: 'Junior Software Engineer, Civic Tech NGO', type: OpportunityType.JOB, description: 'Entry-level developer role building digital tools for civil society organizations. Remote-friendly, React/Node stack.' },
    { title: 'Summer Internship — European Parliament Roma Policy Unit', type: OpportunityType.INTERNSHIP, description: 'Three-month paid internship supporting policy research on Roma inclusion across EU member states.' },
    { title: 'Grant Writing & Fundraising Bootcamp', type: OpportunityType.TRAINING, description: 'Five-day intensive training on writing competitive grant applications for community organizations.' },
    { title: 'Community Innovation Micro-Grant', type: OpportunityType.GRANT, description: 'Grants up to €5,000 for alumni-led community projects addressing education or health gaps.' },
    { title: 'REF Alumni Leadership Summit', type: OpportunityType.EVENT, description: 'Annual three-day gathering of REF alumni across the region, featuring workshops and networking sessions.' },
    { title: 'Public Health Nurse — Regional Clinic Network', type: OpportunityType.JOB, description: 'Full-time nursing position with a regional clinic network serving underserved rural communities.' },
    { title: 'Digital Skills for Educators Training', type: OpportunityType.TRAINING, description: 'Free training program helping teachers integrate digital tools into Roma-inclusive classrooms.' },
    { title: 'Legal Fellowship — Anti-Discrimination Litigation', type: OpportunityType.INTERNSHIP, description: 'One-year paid fellowship with a human rights law firm focused on anti-discrimination cases.' },
    { title: 'Roma Women in Tech Scholarship', type: OpportunityType.SCHOLARSHIP, description: 'Scholarship covering coding bootcamp tuition for Roma women pursuing careers in technology.' },
    { title: 'Social Enterprise Seed Grant', type: OpportunityType.GRANT, description: 'Seed funding up to €10,000 for early-stage social enterprises founded by REF alumni.' },
    { title: 'Journalism Fellowship — Minority Media Program', type: OpportunityType.INTERNSHIP, description: 'Six-month fellowship at a regional newsroom covering minority rights and community affairs.' },
    { title: 'Civil Service Traineeship Program', type: OpportunityType.JOB, description: 'Government traineeship program for recent graduates interested in public administration careers.' },
    { title: 'Entrepreneurship Accelerator Cohort', type: OpportunityType.TRAINING, description: 'Twelve-week accelerator program for early-stage founders, including mentorship and seed capital access.' },
    { title: 'Regional Alumni Networking Evening', type: OpportunityType.EVENT, description: 'Informal evening networking event for alumni working in the same metro area.' },
  ];

  for (let i = 0; i < opportunityTitles.length; i++) {
    const o = opportunityTitles[i];
    const country = COUNTRIES[i % COUNTRIES.length];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + randInt(14, 180));
    await prisma.opportunity.create({
      data: {
        title: o.title,
        description: o.description,
        type: o.type,
        country,
        deadline,
        url: 'https://www.romaeducationfund.org/',
        postedByStaffId: i % 2 === 0 ? staff1.id : staff2.id,
      },
    });
  }

  // --- Mentorship connections + messages ---
  const mentors = seeded.filter((s) => JSON.parse(s.profile.mentorCategories || '[]').length > 0 || s.profile.mentorAvailable);
  const seekers = seeded.filter((s) => s.profile.seekingMentor);

  const pairs: { mentor: SeedProfile; mentee: SeedProfile }[] = [];
  for (let i = 0; i < Math.min(mentors.length, seekers.length, 5); i++) {
    pairs.push({ mentor: mentors[i], mentee: seekers[i] });
  }

  const conversationLines = [
    (mentorName: string, menteeName: string) => `Hi ${mentorName}, thanks for accepting! I saw your profile and would love some advice on breaking into your field.`,
    () => `Of course, happy to help. What specifically are you working on right now?`,
    () => `I'm trying to figure out how to transition from my current role — any tips on where to start?`,
    () => `I'd start by mapping out what skills transfer directly. Want to set up a call this week?`,
    () => `That would be great, thank you! Tuesday afternoon works for me.`,
    () => `Tuesday works. I'll send a calendar invite. In the meantime, take a look at the REF opportunities feed — a couple of trainings might be relevant.`,
    () => `Will do, thanks so much for taking the time.`,
    () => `Happy to. This is exactly why I signed up as a mentor.`,
  ];

  for (const { mentor, mentee } of pairs) {
    const connection = await prisma.mentorshipConnection.create({
      data: {
        mentorProfileId: mentor.profile.id,
        menteeProfileId: mentee.profile.id,
        category: pick(MENTOR_CATEGORIES),
        status: MentorshipStatus.ACCEPTED,
      },
    });

    let sentAt = new Date();
    sentAt.setDate(sentAt.getDate() - 10);
    for (let i = 0; i < conversationLines.length; i++) {
      const isFromMentee = i % 2 === 0;
      sentAt = new Date(sentAt.getTime() + 1000 * 60 * 60 * randInt(2, 20));
      await prisma.message.create({
        data: {
          senderProfileId: isFromMentee ? mentee.profile.id : mentor.profile.id,
          recipientProfileId: isFromMentee ? mentor.profile.id : mentee.profile.id,
          body: conversationLines[i](mentor.profile.firstName, mentee.profile.firstName),
          sentAt,
          readAt: i < conversationLines.length - 2 ? sentAt : null,
        },
      });
    }
  }

  // One pending mentorship request for demo purposes (not yet accepted)
  if (mentors.length > 5 && seekers.length > 5) {
    await prisma.mentorshipConnection.create({
      data: {
        mentorProfileId: mentors[5].profile.id,
        menteeProfileId: seekers.length > 6 ? seekers[6].profile.id : seekers[0].profile.id,
        category: pick(MENTOR_CATEGORIES),
        status: MentorshipStatus.REQUESTED,
      },
    });
  }

  // A pending request targeting the demo alumnus (who is a mentor) so the demo login has something to accept.
  const requester = seeded.find((s) => s.profile.id !== demoProfile.profile.id && s.profile.seekingMentor) ?? seeded[1];
  await prisma.mentorshipConnection.create({
    data: {
      mentorProfileId: demoProfile.profile.id,
      menteeProfileId: requester.profile.id,
      category: 'Technology',
      status: MentorshipStatus.REQUESTED,
    },
  });

  console.log('Seed complete.');
  console.log('--- Demo logins ---');
  console.log('Alumnus:  demo.alumnus@example.org / demo1234');
  console.log('Staff 1:  staff.romania@ref.org / demo1234');
  console.log('Staff 2:  staff.kosovo@ref.org / demo1234');
  const unclaimed = await prisma.user.findMany({ where: { isClaimed: false }, take: 3 });
  console.log('Sample claim codes:', unclaimed.map((u) => u.claimCode).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
