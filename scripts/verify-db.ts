import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function run() {
  const courses = await p.course.findMany({
    include: {
      units: {
        include: { lessons: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  for (const c of courses) {
    console.log(`Course: ${c.id} | ${c.title} | status: ${c.status}`);
    for (const u of c.units) {
      console.log(`  Unit: ${u.id} | ${u.title} | status: ${u.status}`);
      for (const l of u.lessons) {
        console.log(`    Lesson: ${l.id} | ${l.title} | status: ${l.status}`);
      }
    }
  }

  const secs = await p.section.findMany();
  const secStatuses = [...new Set(secs.map((s) => s.status))];
  console.log(`\nSections: ${secs.length} total | statuses: ${secStatuses.join(', ')}`);

  const voc = await p.vocabulary.findMany();
  const vocStatuses = [...new Set(voc.map((v) => v.status))];
  console.log(`Vocabulary: ${voc.length} total | statuses: ${vocStatuses.join(', ')}`);

  const ex = await p.exercise.findMany();
  const exStatuses = [...new Set(ex.map((e) => e.status))];
  console.log(`Exercises: ${ex.length} total | statuses: ${exStatuses.join(', ')}`);

  await p.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
