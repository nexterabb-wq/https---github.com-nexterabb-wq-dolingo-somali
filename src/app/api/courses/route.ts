import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const courses = await db.course.findMany({
      where: { status: 'published' },
      include: {
        units: {
          where: { status: 'published' },
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              where: { status: 'published' },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Courses fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
