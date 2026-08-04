import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const CONTENT_DIR = '/home/z/my-project/content';

// Human/linguist content sources get 'published', AI content gets 'pending_review'
function getStatusForSource(contentSource: string): 'published' | 'pending_review' {
  return contentSource === 'ai' ? 'pending_review' : 'published';
}

interface SeedResult {
  courses: { created: number; updated: number };
  units: { created: number; updated: number };
  lessons: { created: number; updated: number };
  sections: { created: number; updated: number };
  vocabulary: { created: number; updated: number };
  exercises: { created: number; updated: number };
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'linguist') {
      return NextResponse.json(
        { error: 'Forbidden: admin or linguist role required' },
        { status: 403 },
      );
    }

    const result: SeedResult = {
      courses: { created: 0, updated: 0 },
      units: { created: 0, updated: 0 },
      lessons: { created: 0, updated: 0 },
      sections: { created: 0, updated: 0 },
      vocabulary: { created: 0, updated: 0 },
      exercises: { created: 0, updated: 0 },
    };

    // --- 1. Seed Courses ---
    const courseFile = join(CONTENT_DIR, 'course.json');
    try {
      const courseRaw = await readFile(courseFile, 'utf-8');
      const courseData = JSON.parse(courseRaw);
      // Support single object or array
      const courses = Array.isArray(courseData) ? courseData : [courseData];

      for (const c of courses) {
        const contentSource = c.contentSource ?? 'human';
        const status = c.status ?? getStatusForSource(contentSource);
        const course = await db.course.upsert({
          where: { id: c.id },
          update: {
            title: c.title,
            description: c.description ?? null,
            coverImage: c.coverImage ?? null,
            language: c.language ?? 'en',
            sourceLang: c.sourceLang ?? 'so',
            difficulty: c.difficulty ?? 'beginner',
            sortOrder: c.sortOrder ?? 0,
            contentSource,
            status,
          },
          create: {
            id: c.id,
            title: c.title,
            description: c.description ?? null,
            coverImage: c.coverImage ?? null,
            language: c.language ?? 'en',
            sourceLang: c.sourceLang ?? 'so',
            difficulty: c.difficulty ?? 'beginner',
            sortOrder: c.sortOrder ?? 0,
            contentSource,
            status,
          },
        });
        if (course.createdAt.getTime() === course.updatedAt.getTime()) {
          result.courses.created++;
        } else {
          result.courses.updated++;
        }
      }
    } catch {
      // course.json may not exist
    }

    // --- 2. Seed Units ---
    try {
      const files = await readdir(CONTENT_DIR);
      const unitFiles = files.filter((f) => f.startsWith('unit-') && f.endsWith('.json'));

      for (const file of unitFiles) {
        const raw = await readFile(join(CONTENT_DIR, file), 'utf-8');
        const data = JSON.parse(raw);
        const units = Array.isArray(data) ? data : [data];

        for (const u of units) {
          // Find the parent course
          let course;
          if (u.courseId) {
            course = await db.course.findUnique({ where: { id: u.courseId } });
          }
          if (!course && u.courseTitle) {
            course = await db.course.findFirst({ where: { title: u.courseTitle } });
          }
          if (!course) {
            console.warn(`[Seed] Skipping unit "${u.title}": parent course not found`);
            continue;
          }

          const contentSource = u.contentSource ?? 'human';
          const status = u.status ?? getStatusForSource(contentSource);
          const unit = await db.unit.upsert({
            where: { id: u.id },
            update: {
              courseId: course.id,
              title: u.title,
              description: u.description ?? null,
              coverImage: u.coverImage ?? null,
              sortOrder: u.sortOrder ?? 0,
              contentSource,
              status,
            },
            create: {
              id: u.id,
              courseId: course.id,
              title: u.title,
              description: u.description ?? null,
              coverImage: u.coverImage ?? null,
              sortOrder: u.sortOrder ?? 0,
              contentSource,
              status,
            },
          });
          if (unit.createdAt.getTime() === unit.updatedAt.getTime()) {
            result.units.created++;
          } else {
            result.units.updated++;
          }
        }
      }
    } catch {
      // No unit files
    }

    // --- 3. Seed Lessons ---
    try {
      const files = await readdir(CONTENT_DIR);
      const lessonFiles = files.filter((f) => f.startsWith('lesson-') && f.endsWith('.json'));

      for (const file of lessonFiles) {
        const raw = await readFile(join(CONTENT_DIR, file), 'utf-8');
        const data = JSON.parse(raw);
        const lessons = Array.isArray(data) ? data : [data];

        for (const l of lessons) {
          // Find the parent unit
          let unit;
          if (l.unitId) {
            unit = await db.unit.findUnique({ where: { id: l.unitId } });
          }
          if (!unit && l.unitTitle) {
            unit = await db.unit.findFirst({ where: { title: l.unitTitle } });
          }
          if (!unit) {
            console.warn(`[Seed] Skipping lesson "${l.title}": parent unit not found`);
            continue;
          }

          const contentSource = l.contentSource ?? 'human';
          const status = l.status ?? getStatusForSource(contentSource);
          const lesson = await db.lesson.upsert({
            where: { id: l.id },
            update: {
              unitId: unit.id,
              title: l.title,
              description: l.description ?? null,
              type: l.type ?? 'lesson',
              xpReward: l.xpReward ?? 10,
              sortOrder: l.sortOrder ?? 0,
              contentSource,
              status,
            },
            create: {
              id: l.id,
              unitId: unit.id,
              title: l.title,
              description: l.description ?? null,
              type: l.type ?? 'lesson',
              xpReward: l.xpReward ?? 10,
              sortOrder: l.sortOrder ?? 0,
              contentSource,
              status,
            },
          });
          if (lesson.createdAt.getTime() === lesson.updatedAt.getTime()) {
            result.lessons.created++;
          } else {
            result.lessons.updated++;
          }

          // --- 4. Seed Sections within the lesson ---
          if (l.sections && Array.isArray(l.sections)) {
            for (const s of l.sections) {
              const section = await db.section.upsert({
                where: { id: s.id },
                update: {
                  lessonId: lesson.id,
                  title: s.title ?? null,
                  type: s.type ?? 'vocabulary',
                  sortOrder: s.sortOrder ?? 0,
                },
                create: {
                  id: s.id,
                  lessonId: lesson.id,
                  title: s.title ?? null,
                  type: s.type ?? 'vocabulary',
                  sortOrder: s.sortOrder ?? 0,
                  status: 'published',
                },
              });
              if (section.createdAt.getTime() === section.updatedAt.getTime()) {
                result.sections.created++;
              } else {
                result.sections.updated++;
              }

              // --- 5. Seed Vocabulary within sections ---
              if (s.vocabulary && Array.isArray(s.vocabulary)) {
                for (const v of s.vocabulary) {
                  const vocab = await db.vocabulary.upsert({
                    where: { id: v.id },
                    update: {
                      sectionId: section.id,
                      english: v.english,
                      somali: v.somali,
                      pronunciationGuide: v.pronunciationGuide ?? null,
                      partOfSpeech: v.partOfSpeech ?? null,
                      difficulty: v.difficulty ?? 'beginner',
                      exampleSentence: v.exampleSentence ?? null,
                      exampleTranslation: v.exampleTranslation ?? null,
                      grammarNotes: v.grammarNotes ?? null,
                      tags: v.tags ?? '[]',
                      imageUrl: v.imageUrl ?? null,
                      audioUrl: v.audioUrl ?? null,
                      voiceType: v.voiceType ?? null,
                      audioDuration: v.audioDuration ?? null,
                      audioProvider: v.audioProvider ?? null,
                    },
                    create: {
                      id: v.id,
                      sectionId: section.id,
                      english: v.english,
                      somali: v.somali,
                      pronunciationGuide: v.pronunciationGuide ?? null,
                      partOfSpeech: v.partOfSpeech ?? null,
                      difficulty: v.difficulty ?? 'beginner',
                      exampleSentence: v.exampleSentence ?? null,
                      exampleTranslation: v.exampleTranslation ?? null,
                      grammarNotes: v.grammarNotes ?? null,
                      tags: v.tags ?? '[]',
                      imageUrl: v.imageUrl ?? null,
                      audioUrl: v.audioUrl ?? null,
                      voiceType: v.voiceType ?? null,
                      audioDuration: v.audioDuration ?? null,
                      audioProvider: v.audioProvider ?? null,
                      contentSource: l.contentSource ?? 'human',
                      status: getStatusForSource(l.contentSource ?? 'human'),
                    },
                  });
                  if (vocab.createdAt.getTime() === vocab.updatedAt.getTime()) {
                    result.vocabulary.created++;
                  } else {
                    result.vocabulary.updated++;
                  }
                }
              }

              // --- 6. Seed Exercises within sections ---
              if (s.exercises && Array.isArray(s.exercises)) {
                for (const e of s.exercises) {
                  // config must be a JSON string
                  const configStr =
                    typeof e.config === 'string' ? e.config : JSON.stringify(e.config);
                  const exercise = await db.exercise.upsert({
                    where: { id: e.id },
                    update: {
                      sectionId: section.id,
                      exerciseType: e.exerciseType,
                      config: configStr,
                      xpReward: e.xpReward ?? 5,
                      sortOrder: e.sortOrder ?? 0,
                    },
                    create: {
                      id: e.id,
                      sectionId: section.id,
                      exerciseType: e.exerciseType,
                      config: configStr,
                      xpReward: e.xpReward ?? 5,
                      sortOrder: e.sortOrder ?? 0,
                      contentSource: l.contentSource ?? 'human',
                      status: getStatusForSource(l.contentSource ?? 'human'),
                    },
                  });
                  if (exercise.createdAt.getTime() === exercise.updatedAt.getTime()) {
                    result.exercises.created++;
                  } else {
                    result.exercises.updated++;
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // No lesson files
    }

    return NextResponse.json({
      message: 'Seed completed successfully',
      result,
    });
  } catch (error) {
    console.error('[POST /api/seed] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
