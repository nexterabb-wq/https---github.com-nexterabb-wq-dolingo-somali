import { PrismaClient, ContentStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const contentDir = path.join(process.cwd(), 'content');

/**
 * Determines the status for a content item.
 * - If the JSON has a 'status' field, use it (respecting the content workflow).
 * - If the JSON has no 'status' field (e.g. vocabulary/exercises without explicit status),
 *   inherit from the parent's contentSource: 'linguist'/'human' → 'published', else → 'pending_review'.
 * - contentSource 'ai' always defaults to 'pending_review' unless explicitly overridden.
 */
function resolveStatus(
  item: Record<string, unknown>,
  parentContentSource?: string,
): ContentStatus {
  if (item.status && Object.values(ContentStatus).includes(item.status as ContentStatus)) {
    return item.status as ContentStatus;
  }
  // Default based on contentSource
  const source = (item.contentSource as string) || parentContentSource || 'human';
  return source === 'ai' ? 'pending_review' : 'published';
}

async function main() {
  console.log('Seeding content (respecting status from JSON files)...');

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
    const status = resolveStatus(raw);
    const course = { ...raw, status };
    await prisma.course.upsert({
      where: { id: course.id },
      update: course,
      create: course,
    });
    console.log(`  ${status === 'published' ? '✓' : '⏳'} Course: ${course.title} [${status}]`);
    courseCount++;
  } else {
    console.log('  ✗ course.json not found');
  }

  // --- Seed units ---
  const unitFiles = fs.readdirSync(contentDir).filter(f => f.startsWith('unit-') && f.endsWith('.json'));
  for (const file of unitFiles.sort()) {
    const raw = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf-8'));
    const status = resolveStatus(raw);
    const unit = { ...raw, status };
    await prisma.unit.upsert({
      where: { id: unit.id },
      update: unit,
      create: unit,
    });
    console.log(`  ${status === 'published' ? '✓' : '⏳'} Unit: ${unit.title} [${status}]`);
    unitCount++;
  }

  // --- Seed lessons with nested sections, vocabulary, exercises ---
  const lessonFiles = fs.readdirSync(contentDir).filter(f => f.startsWith('lesson-') && f.endsWith('.json'));
  for (const file of lessonFiles.sort()) {
    const lessonData = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf-8'));
    const { sections, ...lessonFields } = lessonData;

    const lessonStatus = resolveStatus(lessonFields);
    const lesson = { ...lessonFields, status: lessonStatus };
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: lesson,
      create: lesson,
    });
    console.log(`  ${lessonStatus === 'published' ? '✓' : '⏳'} Lesson: ${lesson.title} [${lessonStatus}]`);
    lessonCount++;

    if (sections) {
      for (const section of sections) {
        const { vocabulary, exercises, ...sectionFields } = section;

        const secStatus = resolveStatus(sectionFields, lesson.contentSource as string);
        // Section model doesn't have contentSource — strip it
        const { contentSource: _secCS, ...secClean } = sectionFields;
        const sec = { ...secClean, status: secStatus };
        await prisma.section.upsert({
          where: { id: sec.id },
          update: sec,
          create: sec,
        });
        sectionCount++;

        if (vocabulary) {
          for (const vocab of vocabulary) {
            const vStatus = resolveStatus(vocab, section.contentSource as string || lesson.contentSource as string);
            const vocabData = {
              ...vocab,
              tags: Array.isArray(vocab.tags) ? JSON.stringify(vocab.tags) : vocab.tags,
              status: vStatus,
            };
            await prisma.vocabulary.upsert({
              where: { id: vocabData.id },
              update: vocabData,
              create: vocabData,
            });
            vocabCount++;
          }
        }

        if (exercises) {
          for (const exercise of exercises) {
            const eStatus = resolveStatus(exercise, section.contentSource as string || lesson.contentSource as string);
            const exerciseData = {
              ...exercise,
              config: typeof exercise.config === 'string' ? exercise.config : JSON.stringify(exercise.config),
              status: eStatus,
            };
            await prisma.exercise.upsert({
              where: { id: exerciseData.id },
              update: exerciseData,
              create: exerciseData,
            });
            exerciseCount++;
          }
        }

        console.log(`    ${secStatus === 'published' ? '✓' : '⏳'} Section: ${sec.title || sec.id} (${(vocabulary?.length ?? 0)} vocab, ${(exercises?.length ?? 0)} exercises) [${secStatus}]`);
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
