import { PrismaClient } from '@prisma/client';
const p = new PrismaClient({datasources:{db:{url:'file:/home/z/my-project/db/custom.db'}}});
async function check() {
  const units = await p.unit.findMany({include:{lessons:true},orderBy:{sortOrder:'asc'}});
  for (const u of units) {
    console.log('Unit:', u.title, '| status:', u.status);
    for (const l of u.lessons) {
      console.log('  Lesson:', l.title, '| status:', l.status);
    }
  }
  await p.$disconnect();
}
check();
