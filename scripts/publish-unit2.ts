import { PrismaClient } from '@prisma/client';
const p = new PrismaClient({datasources:{db:{url:'file:/home/z/my-project/db/custom.db'}}});
async function publish() {
  const result = await p.lesson.updateMany({
    where: { status: 'pending_review' },
    data: { status: 'published' },
  });
  console.log(`Published ${result.count} lessons`);

  // Verify
  const units = await p.unit.findMany({include:{lessons:true},orderBy:{sortOrder:'asc'}});
  for (const u of units) {
    console.log(`Unit: ${u.title} (${u.lessons.length} lessons)`);
    for (const l of u.lessons) {
      console.log(`  ✓ ${l.title} [${l.status}]`);
    }
  }
  await p.$disconnect();
}
publish();
