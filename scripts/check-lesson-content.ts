import { PrismaClient } from '@prisma/client';
const p = new PrismaClient({datasources:{db:{url:'file:/home/z/my-project/db/custom.db'}}});
async function check() {
  // Check Unit 2 lessons
  const unit2 = await p.unit.findFirst({where:{title:'Family & People'},include:{lessons:{include:{sections:{include:{vocabulary:true,exercises:true}}}}}});
  if (!unit2) { console.log('Unit not found'); await p.$disconnect(); return; }
  for (const lesson of unit2.lessons) {
    console.log(`\nLesson: ${lesson.title} (id: ${lesson.id})`);
    if (lesson.sections.length === 0) {
      console.log('  NO SECTIONS');
    } else {
      for (const s of lesson.sections) {
        console.log(`  Section: ${s.title} [${s.type}] | vocab: ${s.vocabulary.length} | exercises: ${s.exercises.length}`);
      }
    }
  }
  // Also check Unit 1 for comparison
  const unit1 = await p.unit.findFirst({where:{title:'Greetings & Basics'},include:{lessons:{include:{sections:{include:{vocabulary:true,exercises:true}}}}}});
  if (unit1) {
    console.log('\n--- Unit 1 for comparison ---');
    for (const lesson of unit1.lessons) {
      console.log(`\nLesson: ${lesson.title} (id: ${lesson.id})`);
      for (const s of lesson.sections) {
        console.log(`  Section: ${s.title} [${s.type}] | vocab: ${s.vocabulary.length} | exercises: ${s.exercises.length}`);
      }
    }
  }
  await p.$disconnect();
}
check();
