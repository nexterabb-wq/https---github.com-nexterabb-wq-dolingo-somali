import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Query parameter "lessonId" is required' },
        { status: 400 },
      );
    }

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          select: {
            id: true,
            title: true,
            course: {
              select: { id: true, title: true },
            },
          },
        },
        sections: {
          where: { status: 'published' },
          orderBy: { sortOrder: 'asc' },
          include: {
            vocabulary: {
              where: { status: 'published' },
              orderBy: { id: 'asc' },
            },
            exercises: {
              where: { status: 'published' },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (lesson.status !== 'published') {
      return NextResponse.json({ error: 'Lesson not available' }, { status: 404 });
    }

    // Parse exercise config JSON strings into objects
    const sectionsWithParsedConfig = lesson.sections.map((section) => ({
      ...section,
      exercises: section.exercises.map((exercise) => ({
        ...exercise,
        config: JSON.parse(exercise.config),
      })),
    }));

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      xpReward: lesson.xpReward,
      unit: lesson.unit,
      sections: sectionsWithParsedConfig,
    });
  } catch (error) {
    console.error('[GET /api/lessons] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
