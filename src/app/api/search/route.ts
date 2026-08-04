import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    if (q.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    const query = `%${q}%`;

    // Run all searches in parallel
    const [vocabularyResults, lessonResults] = await Promise.all([
      // Search vocabulary by english or somali
      db.vocabulary.findMany({
        where: {
          status: 'published',
          OR: [
            { english: { contains: q } },
            { somali: { contains: q } },
          ],
        },
        select: {
          id: true,
          english: true,
          somali: true,
          pronunciationGuide: true,
          partOfSpeech: true,
          difficulty: true,
          imageUrl: true,
        },
        take: 20,
      }),

      // Search lessons by title
      db.lesson.findMany({
        where: {
          status: 'published',
          title: { contains: q },
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          xpReward: true,
          unit: {
            select: {
              id: true,
              title: true,
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      query: q,
      results: {
        vocabulary: vocabularyResults,
        lessons: lessonResults,
      },
      total: vocabularyResults.length + lessonResults.length,
    });
  } catch (error) {
    console.error('[GET /api/search] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
