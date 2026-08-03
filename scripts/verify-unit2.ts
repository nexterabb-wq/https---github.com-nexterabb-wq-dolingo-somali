import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function run() {
  // Check Unit 2 lessons
  const lessons = await p.lesson.findMany({
    where: { unitId: 'unit-02' },
    select: { id: true, title: true, status: true },
  });
  console.log('Unit 2 Lessons:');
  for (const l of lessons) console.log(`  ${l.id} | ${l.title} | ${l.status}`);

  // Check Unit 2 sections
  const secIds = lessons.map(l => l.id);
  const sections = await p.section.findMany({
    where: { lessonId: { in: secIds } },
    select: { id: true, title: true, status: true },
  });
  console.log('\nUnit 2 Sections:');
  for (const s of sections) console.log(`  ${s.id} | ${s.title} | ${s.status}`);

  // Check Unit 2 vocabulary
  const vocab = await p.vocabulary.findMany({
    where: { sectionId: { in: sections.map(s => s.id) } },
    select: { id: true, english: true, status: true, contentSource: true },
  });
  console.log(`\nUnit 2 Vocabulary (${vocab.length} items):`);
  const statuses = new Set(vocab.map(v => v.status));
  const sources = new Set(vocab.map(v => v.contentSource));
  console.log(`  Statuses: ${[...statuses].join(', ')}`);
  console.log(`  Sources: ${[...sources].join(', ')}`);
  for (const v of vocab.slice(0, 3)) console.log(`  ${v.id} | ${v.english} | ${v.status} | ${v.contentSource}`);
  console.log('  ...');

  // Check Unit 2 exercises
  const exercises = await p.exercise.findMany({
    where: { sectionId: { in: sections.map(s => s.id) } },
    select: { id: true, status: true, contentSource: true },
  });
  console.log(`\nUnit 2 Exercises (${exercises.length} items):`);
  const eStatuses = new Set(exercises.map(e => e.status));
  const eSources = new Set(exercises.map(e => e.contentSource));
  console.log(`  Statuses: ${[...eStatuses].join(', ')}`);
  console.log(`  Sources: ${[...eSources].join(', ')}`);

  // Verify Unit 1 is untouched
  const unit1Lessons = await p.lesson.findMany({
    where: { unitId: 'unit-01' },
    select: { title: true, status: true },
  });
  console.log('\nUnit 1 Lessons (should all be published):');
  for (const l of unit1Lessons) console.log(`  ${l.title} | ${l.status}`);

  await p.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
