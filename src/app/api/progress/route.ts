import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await db.userProgress.findMany({
      where: { userId: session.user.id },
    });

    const progressMap: Record<string, unknown> = {};
    for (const p of progress) {
      progressMap[p.lessonId] = {
        lessonId: p.lessonId,
        completed: p.completed,
        score: p.score,
        attempts: p.attempts,
        bestScore: p.bestScore,
        completedAt: p.completedAt?.toISOString() ?? null,
      };
    }

    return NextResponse.json(progressMap);
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId, score, xpEarned } = await req.json();
    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId required' }, { status: 400 });
    }

    const userId = session.user.id;

    const existing = await db.userProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    const completed = score !== undefined && score >= 70;
    const progress = await db.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        completed,
        score,
        attempts: 1,
        bestScore: score,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed: existing?.completed || completed,
        score,
        attempts: { increment: 1 },
        bestScore: Math.max(existing?.bestScore ?? 0, score ?? 0),
        completedAt: completed && !existing?.completed ? new Date() : existing?.completedAt,
      },
    });

    // Update gamification
    if (xpEarned && xpEarned > 0) {
      await db.xpTransaction.create({
        data: { userId, amount: xpEarned, source: 'lesson_complete', sourceId: lessonId },
      });
    }

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    await db.userStatistic.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        lessonsCompleted: completed ? 1 : 0,
        xpEarned: xpEarned || 0,
      },
      update: {
        lessonsCompleted: completed ? { increment: 1 } : undefined,
        xpEarned: { increment: xpEarned || 0 },
      },
    });

    // Update streak
    if (completed) {
      const streak = await db.dailyStreak.findUnique({
        where: { userId },
      });
      if (streak) {
        const todayDate = new Date().toISOString().split('T')[0];
        const lastActive = streak.lastActiveAt?.toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let newCurrent = 1;
        if (lastActive === yesterday) {
          newCurrent = streak.currentStreak + 1;
        } else if (lastActive === todayDate) {
          newCurrent = streak.currentStreak;
        }

        await db.dailyStreak.update({
          where: { userId },
          data: {
            currentStreak: newCurrent,
            longestStreak: Math.max(streak.longestStreak, newCurrent),
            lastActiveAt: new Date(),
          },
        });
      }
    }

    // Award coins
    const coinAmount = Math.floor((score ?? 0) / 10);
    if (coinAmount > 0) {
      await db.coins.update({
        where: { userId },
        data: { balance: { increment: coinAmount } },
      });
      await db.coinTransaction.create({
        data: { userId, amount: coinAmount, source: 'lesson_complete', sourceId: lessonId },
      });
    }

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Progress save error:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}