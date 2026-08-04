import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function check() {
  const lessons = await db.lesson.findMany({
    select: { id: true, title: true, status: true, contentSource: true },
    orderBy: { sortOrder: 'asc' },
  });
  console.log('=== ALL LESSONS ===');
  for (const l of lessons) {
    console.log(`${l.id} | ${l.status} | ${l.contentSource} | ${l.title}`);
  }

  const prCount = await db.lesson.count({ where: { status: 'pending_review' } });
  const pubCount = await db.lesson.count({ where: { status: 'published' } });
  console.log(`\nPending review: ${prCount} | Published: ${pubCount}`);

  const vocabPR = await db.vocabulary.count({ where: { status: 'pending_review' } });
  const exPR = await db.exercise.count({ where: { status: 'pending_review' } });
  console.log(`Pending vocab: ${vocabPR} | Pending exercises: ${exPR}`);

  // Check sections too
  const secPR = await db.section.count({ where: { status: 'pending_review' } });
  console.log(`Pending sections: ${secPR}`);

  await db.$disconnect();
}
check();
