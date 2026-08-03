import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const contentDir = path.join(process.cwd(), 'content');

async function main() {
  console.log('Seeding foundational content (all set to published)...');

  let courseCount = 0;
  let unitCount = 0;
  let lessonCount = 0;
  let sectionCount = 0;
  let vocabCount = 0;
  let exerciseCount = 0;

  // --- Seed course ---
  const courseFile = path.join(contentDir, 'course.json');
  if (fs.existsSync(courseFile)) {
    const raw = JSON.parse(fs.readFileSync(courseFile, 'utf-8'));
    const course = { ...raw, status: 'published' as const };
    await prisma.course.upsert({
      where: { id: course.id },
      update: course,
      create: course,
    });
    console.log(`  ✓ Course: ${course.title} [${course.status}]`);
    courseCount++;
  } else {
    console.log('  ✗ course.json not found');
  }

  // --- Seed units ---
  const unitFiles = fs.readdirSync(contentDir).filter(f => f.startsWith('unit-') && f.endsWith('.json'));
  for (const file of unitFiles.sort()) {
    const raw = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf-8'));
    const unit = { ...raw, status: 'published' as const };
    await prisma.unit.upsert({
      where: { id: unit.id },
      update: unit,
      create: unit,
    });
    console.log(`  ✓ Unit: ${unit.title} [${unit.status}]`);
    unitCount++;
  }

  // --- Seed lessons with nested sections, vocabulary, exercises ---
  const lessonFiles = fs.readdirSync(contentDir).filter(f => f.startsWith('lesson-') && f.endsWith('.json'));
  for (const file of lessonFiles.sort()) {
    const lessonData = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf-8'));
    const { sections, ...lessonFields } = lessonData;

    // Force published on lesson
    const lesson = { ...lessonFields, status: 'published' as const };
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: lesson,
      create: lesson,
    });
    console.log(`  ✓ Lesson: ${lesson.title} [${lesson.status}]`);
    lessonCount++;

    if (sections) {
      for (const section of sections) {
        const { vocabulary, exercises, ...sectionFields } = section;

        // Force published on section
        const sec = { ...sectionFields, status: 'published' as const };
        await prisma.section.upsert({
          where: { id: sec.id },
          update: sec,
          create: sec,
        });
        sectionCount++;

        // Seed vocabulary — force published
        if (vocabulary) {
          for (const vocab of vocabulary) {
            const vocabData = {
              ...vocab,
              tags: Array.isArray(vocab.tags) ? JSON.stringify(vocab.tags) : vocab.tags,
              status: 'published' as const,
            };
            await prisma.vocabulary.upsert({
              where: { id: vocabData.id },
              update: vocabData,
              create: vocabData,
            });
            vocabCount++;
          }
        }

        // Seed exercises — force published
        if (exercises) {
          for (const exercise of exercises) {
            const exerciseData = {
              ...exercise,
              config: typeof exercise.config === 'string' ? exercise.config : JSON.stringify(exercise.config),
              status: 'published' as const,
            };
            await prisma.exercise.upsert({
              where: { id: exerciseData.id },
              update: exerciseData,
              create: exerciseData,
            });
            exerciseCount++;
          }
        }

        console.log(`    Section: ${sec.title || sec.id} (${(vocabulary?.length ?? 0)} vocab, ${(exercises?.length ?? 0)} exercises)`);
      }
    }
  }

  console.log('\n--- Seed Summary ---');
  console.log(`  Courses:   ${courseCount}`);
  console.log(`  Units:     ${unitCount}`);
  console.log(`  Lessons:   ${lessonCount}`);
  console.log(`  Sections:  ${sectionCount}`);
  console.log(`  Vocab:     ${vocabCount}`);
  console.log(`  Exercises: ${exerciseCount}`);
  console.log(`  Total:     ${courseCount + unitCount + lessonCount + sectionCount + vocabCount + exerciseCount} records`);
  console.log('Content seeding complete!');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
