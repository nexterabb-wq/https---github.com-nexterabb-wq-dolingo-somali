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

    // Fetch all data in parallel
    const [xpTransactions, hearts, coins, streak, levels, achievements, userAchievements] =
      await Promise.all([
        // Total XP
        db.xpTransaction.aggregate({
          where: { userId },
          _sum: { amount: true },
        }),
        // Hearts
        db.hearts.findUnique({
          where: { userId },
        }),
        // Coins
        db.coins.findUnique({
          where: { userId },
        }),
        // Streak
        db.dailyStreak.findUnique({
          where: { userId },
        }),
        // All levels
        db.level.findMany({
          orderBy: { level: 'asc' },
        }),
        // All achievements
        db.achievement.findMany({
          orderBy: { category: 'asc' },
        }),
        // User's awarded achievements
        db.userAchievement.findMany({
          where: { userId },
          select: { achievementId: true, awardedAt: true },
        }),
      ]);

    const totalXp = xpTransactions._sum.amount ?? 0;

    // Determine current level: highest level whose xpRequired <= totalXp
    const currentLevel =
      levels
        .filter((l) => l.xpRequired <= totalXp)
        .sort((a, b) => b.xpRequired - a.xpRequired)[0] ?? null;

    // Next level for progress calculation
    const nextLevel = currentLevel
      ? levels.find((l) => l.level === (currentLevel.level + 1)) ?? null
      : levels[0] ?? null;

    // XP progress within current level
    const currentLevelXp = currentLevel?.xpRequired ?? 0;
    const nextLevelXp = nextLevel?.xpRequired ?? currentLevelXp;
    const xpInLevel = totalXp - currentLevelXp;
    const xpNeededForNext = nextLevelXp - currentLevelXp;
    const levelProgress = xpNeededForNext > 0 ? xpInLevel / xpNeededForNext : 0;

    // Build awarded set
    const awardedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua.awardedAt]));

    const achievementsWithStatus = achievements.map((a) => ({
      ...a,
      awarded: awardedMap.has(a.id),
      awardedAt: awardedMap.get(a.id) ?? null,
    }));

    return NextResponse.json({
      totalXp,
      hearts: hearts
        ? { current: hearts.current, max: hearts.maxHearts, lastRefillAt: hearts.lastRefillAt }
        : { current: 5, max: 5, lastRefillAt: null },
      coins: coins?.balance ?? 0,
      streak: streak
        ? { current: streak.currentStreak, longest: streak.longestStreak, lastActiveAt: streak.lastActiveAt }
        : { current: 0, longest: 0, lastActiveAt: null },
      currentLevel: currentLevel
        ? {
            level: currentLevel.level,
            title: currentLevel.title,
            icon: currentLevel.icon,
          }
        : null,
      nextLevel: nextLevel
        ? {
            level: nextLevel.level,
            title: nextLevel.title,
            xpRequired: nextLevel.xpRequired,
          }
        : null,
      levelProgress: Math.min(levelProgress, 1),
      levels: levels.map((l) => ({
        level: l.level,
        title: l.title,
        xpRequired: l.xpRequired,
        icon: l.icon,
      })),
      achievements: achievementsWithStatus,
    });
  } catch (error) {
    console.error('[GET /api/gamification] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
