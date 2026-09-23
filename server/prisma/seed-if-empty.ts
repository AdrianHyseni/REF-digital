// Used by the Docker entrypoint so a container restart never wipes out
// in-progress demo data: seed.ts itself is destructive (it clears every
// table before reseeding), so this only calls it the first time, when the
// database is genuinely empty.
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`Database already has ${userCount} users — skipping auto-seed.`);
    return;
  }
  console.log('Database is empty — running seed script...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
