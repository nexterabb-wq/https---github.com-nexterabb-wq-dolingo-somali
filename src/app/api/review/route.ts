import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const REVIEWABLE_TYPES = ['course', 'unit', 'lesson', 'vocabulary', 'exercise'] as const;
type ReviewableType = (typeof REVIEWABLE_TYPES)[number];
const REVIEWER_ROLES = ['reviewer', 'admin', 'linguist'];

/**
 * Get the authenticated user — supports both NextAuth session cookies
 * and SPA-style userId query/header (for the SPA auth pattern).
 */
async function getAuthUser(request: NextRequest) {
  // Try NextAuth session first
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return session.user;
  }

  // Fallback: SPA auth via userId query param or header
  const userId =
    request.nextUrl.searchParams.get('userId') ||
    request.headers.get('x-user-id');
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (user) return user;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!REVIEWER_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: reviewer role required' }, { status: 403 });
    }

    const [courses, units, lessons, vocabulary, exercises] = await Promise.all([
      db.course.findMany({
        where: { status: 'pending_review' },
        orderBy: { createdAt: 'desc' },
      }),
      db.unit.findMany({
        where: { status: 'pending_review' },
        include: { course: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.lesson.findMany({
        where: { status: 'pending_review' },
        include: { unit: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.vocabulary.findMany({
        where: { status: 'pending_review' },
        include: { section: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.exercise.findMany({
        where: { status: 'pending_review' },
        include: { section: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      courses,
      units,
      lessons,
      vocabulary,
      exercises,
      total: courses.length + units.length + lessons.length + vocabulary.length + exercises.length,
    });
  } catch (error) {
    console.error('[GET /api/review] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!REVIEWER_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: reviewer role required' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, action } = body;

    // Validate type
    if (!type || !REVIEWABLE_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${REVIEWABLE_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate id
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    // Validate action
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'published' : 'draft';

    // Verify item exists and is pending_review, then update
    const updateData = { status: newStatus as 'published' | 'draft' };

    let updated;
    switch (type as ReviewableType) {
      case 'course': {
        const existing = await db.course.findUnique({ where: { id } });
        if (!existing || existing.status !== 'pending_review') {
          return NextResponse.json(
            { error: 'Course not found or not in pending_review status' },
            { status: 404 },
          );
        }
        updated = await db.course.update({ where: { id }, data: updateData });
        break;
      }
      case 'unit': {
        const existing = await db.unit.findUnique({ where: { id } });
        if (!existing || existing.status !== 'pending_review') {
          return NextResponse.json(
            { error: 'Unit not found or not in pending_review status' },
            { status: 404 },
          );
        }
        updated = await db.unit.update({ where: { id }, data: updateData });
        break;
      }
      case 'lesson': {
        const existing = await db.lesson.findUnique({ where: { id } });
        if (!existing || existing.status !== 'pending_review') {
          return NextResponse.json(
            { error: 'Lesson not found or not in pending_review status' },
            { status: 404 },
          );
        }
        updated = await db.lesson.update({ where: { id }, data: updateData });
        break;
      }
      case 'vocabulary': {
        const existing = await db.vocabulary.findUnique({ where: { id } });
        if (!existing || existing.status !== 'pending_review') {
          return NextResponse.json(
            { error: 'Vocabulary not found or not in pending_review status' },
            { status: 404 },
          );
        }
        updated = await db.vocabulary.update({ where: { id }, data: updateData });
        break;
      }
      case 'exercise': {
        const existing = await db.exercise.findUnique({ where: { id } });
        if (!existing || existing.status !== 'pending_review') {
          return NextResponse.json(
            { error: 'Exercise not found or not in pending_review status' },
            { status: 404 },
          );
        }
        updated = await db.exercise.update({ where: { id }, data: updateData });
        break;
      }
    }

    return NextResponse.json({
      message: `${type} ${action}d successfully`,
      item: updated,
    });
  } catch (error) {
    console.error('[POST /api/review] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
