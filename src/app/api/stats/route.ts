import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Generate last 7 days of date strings
    const today = new Date();
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
    }

    // Fetch stats for last 7 days
    const stats = await db.userStatistic.findMany({
      where: {
        userId,
        date: { in: dates },
      },
      orderBy: { date: 'asc' },
    });

    // Build a map by date for easy lookup
    const statsMap = new Map(stats.map((s) => [s.date, s]));

    // Ensure all 7 days are present, filling missing days with zeros
    const dailyStats = dates.map((date) => {
      const existing = statsMap.get(date);
      return {
        date,
        lessonsCompleted: existing?.lessonsCompleted ?? 0,
        exercisesCompleted: existing?.exercisesCompleted ?? 0,
        xpEarned: existing?.xpEarned ?? 0,
        timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
        accuracy: existing?.accuracy ?? null,
      };
    });

    // Compute weekly aggregates
    const weeklyTotals = {
      totalLessonsCompleted: 0,
      totalExercisesCompleted: 0,
      totalXpEarned: 0,
      totalTimeSpentSeconds: 0,
      averageAccuracy: 0,
      daysActive: 0,
    };

    const accuracyValues: number[] = [];

    for (const day of dailyStats) {
      weeklyTotals.totalLessonsCompleted += day.lessonsCompleted;
      weeklyTotals.totalExercisesCompleted += day.exercisesCompleted;
      weeklyTotals.totalXpEarned += day.xpEarned;
      weeklyTotals.totalTimeSpentSeconds += day.timeSpentSeconds;
      if (day.lessonsCompleted > 0 || day.exercisesCompleted > 0) {
        weeklyTotals.daysActive++;
      }
      if (day.accuracy !== null) {
        accuracyValues.push(day.accuracy);
      }
    }

    if (accuracyValues.length > 0) {
      weeklyTotals.averageAccuracy =
        Math.round((accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length) * 100) /
        100;
    }

    // Format time nicely
    const totalMinutes = Math.floor(weeklyTotals.totalTimeSpentSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return NextResponse.json({
      period: {
        from: dates[0],
        to: dates[dates.length - 1],
        days: 7,
      },
      daily: dailyStats,
      weekly: {
        ...weeklyTotals,
        totalTimeFormatted: hours > 0
          ? `${hours}h ${minutes}m`
          : `${minutes}m`,
      },
    });
  } catch (error) {
    console.error('[GET /api/stats] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
