import { PrismaClient } from '@prisma/client';
const p = new PrismaClient({datasources:{db:{url:'file:/home/z/my-project/db/custom.db'}}});
async function publish() {
  // Publish all pending_review content
  const [sections, vocab, exercises] = await Promise.all([
    p.section.updateMany({ where: { status: 'pending_review' }, data: { status: 'published' } }),
    p.vocabulary.updateMany({ where: { status: 'pending_review' }, data: { status: 'published' } }),
    p.exercise.updateMany({ where: { status: 'pending_review' }, data: { status: 'published' } }),
  ]);
  console.log(`Published: ${sections.count} sections, ${vocab.count} vocabulary, ${exercises.count} exercises`);

  // Verify Unit 2
  const unit2 = await p.unit.findFirst({where:{title:'Family & People'},include:{lessons:{include:{sections:{include:{vocabulary:true,exercises:true}}}}}});
  if (unit2) {
    console.log('\nVerification:');
    for (const lesson of unit2.lessons) {
      const totalV = lesson.sections.reduce((a,s) => a + s.vocabulary.length, 0);
      const totalE = lesson.sections.reduce((a,s) => a + s.exercises.length, 0);
      console.log(`  ${lesson.title}: ${totalV} vocab, ${totalE} exercises [${lesson.sections.map(s=>s.status).join(',')}]`);
    }
  }
  await p.$disconnect();
}
publish();
