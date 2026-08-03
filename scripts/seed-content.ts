import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const contentDir = path.join(process.cwd(), 'content');

async function main() {
  console.log('Seeding content...');

  // Seed course
  const courseFile = path.join(contentDir, 'course.json');
  if (fs.existsSync(courseFile)) {
    const course = JSON.parse(fs.readFileSync(courseFile, 'utf-8'));
    await prisma.course.upsert({
      where: { id: course.id },
      update: course,
      create: course,
    });
    console.log(`  Course: ${course.title}`);
  }

  // Seed units
  const unitFiles = fs.readdirSync(contentDir).filter(f => f.startsWith('unit-') && f.endsWith('.json'));
  for (const file of unitFiles.sort()) {
    const unit = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf-8'));
    await prisma.unit.upsert({
      where: { id: unit.id },
      update: unit,
      create: unit,
    });
    console.log(`  Unit: ${unit.title}`);
  }

  // Seed lessons with sections, vocabulary, and exercises
  const lessonFiles = fs.readdirSync(contentDir).filter(f => f.startsWith('lesson-') && f.endsWith('.json'));
  for (const file of lessonFiles.sort()) {
    const lessonData = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf-8'));
    const { sections, ...lessonFields } = lessonData;

    await prisma.lesson.upsert({
      where: { id: lessonFields.id },
      update: lessonFields,
      create: lessonFields,
    });
    console.log(`  Lesson: ${lessonFields.title}`);

    if (sections) {
      for (const section of sections) {
        const { vocabulary, exercises, ...sectionFields } = section;

        await prisma.section.upsert({
          where: { id: sectionFields.id },
          update: sectionFields,
          create: sectionFields,
        });

        if (vocabulary) {
          for (const vocab of vocabulary) {
            const vocabData = {
              ...vocab,
              tags: Array.isArray(vocab.tags) ? JSON.stringify(vocab.tags) : vocab.tags,
            };
            await prisma.vocabulary.upsert({
              where: { id: vocabData.id },
              update: vocabData,
              create: vocabData,
            });
          }
          console.log(`    Section: ${sectionFields.title || sectionFields.id} (${vocabulary.length} vocab)`);
        }

        if (exercises) {
          for (const exercise of exercises) {
            const exerciseData = {
              ...exercise,
              config: typeof exercise.config === 'string' ? exercise.config : JSON.stringify(exercise.config),
            };
            await prisma.exercise.upsert({
              where: { id: exerciseData.id },
              update: exerciseData,
              create: exerciseData,
            });
          }
          console.log(`    Section: ${sectionFields.title || sectionFields.id} (${exercises.length} exercises)`);
        }
      }
    }
  }

  console.log('Content seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
