import { PrismaClient } from '@prisma/client';
const p = new PrismaClient({datasources:{db:{url:'file:/home/z/my-project/db/custom.db'}}});
async function check() {
  const unit2 = await p.unit.findFirst({where:{title:'Family & People'},include:{lessons:{include:{sections:{include:{vocabulary:true,exercises:true}}}}}});
  if (!unit2) { console.log('Unit not found'); await p.$disconnect(); return; }
  for (const lesson of unit2.lessons) {
    console.log(`\nLesson: ${lesson.title} [${lesson.status}]`);
    for (const s of lesson.sections) {
      console.log(`  Section: ${s.title} [${s.type}] [${s.status}]`);
      for (const v of s.vocabulary) console.log(`    Vocab: ${v.english} [${v.status}]`);
      for (const e of s.exercises) console.log(`    Exercise: ${e.type} [${e.status}]`);
    }
  }
  await p.$disconnect();
}
check();
