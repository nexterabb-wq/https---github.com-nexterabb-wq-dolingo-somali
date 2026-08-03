import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod/v4';

const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name || null,
        passwordHash,
      },
    });

    // Initialize gamification state
    await Promise.all([
      db.hearts.create({ data: { userId: user.id, current: 5, maxHearts: 5 } }),
      db.coins.create({ data: { userId: user.id, balance: 0 } }),
      db.dailyStreak.create({ data: { userId: user.id } }),
    ]);

    // Seed default levels
    const defaultLevels = [
      { level: 1, title: 'Beginner', xpRequired: 0, icon: '🌱' },
      { level: 2, title: 'Novice', xpRequired: 50, icon: '🌿' },
      { level: 3, title: 'Learner', xpRequired: 150, icon: '📖' },
      { level: 4, title: 'Student', xpRequired: 300, icon: '✏️' },
      { level: 5, title: 'Scholar', xpRequired: 500, icon: '🎓' },
      { level: 6, title: 'Expert', xpRequired: 800, icon: '⭐' },
      { level: 7, title: 'Master', xpRequired: 1200, icon: '🏅' },
      { level: 8, title: 'Grandmaster', xpRequired: 1800, icon: '🏆' },
      { level: 9, title: 'Legend', xpRequired: 2500, icon: '💎' },
      { level: 10, title: 'Polyglot', xpRequired: 3500, icon: '👑' },
    ];

    for (const lvl of defaultLevels) {
      const exists = await db.level.findUnique({ where: { level: lvl.level } });
      if (!exists) {
        await db.level.create({ data: lvl });
      }
    }

    // Seed default achievements
    const defaultAchievements = [
      { key: 'first_lesson', title: 'First Steps', description: 'Complete your first lesson', icon: '🎯', xpReward: 10, coinReward: 5, category: 'learning' },
      { key: 'week_streak', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', xpReward: 50, coinReward: 25, category: 'streak' },
      { key: 'vocab_10', title: 'Word Collector', description: 'Learn 10 vocabulary words', icon: '📚', xpReward: 20, coinReward: 10, category: 'mastery' },
      { key: 'perfect_lesson', title: 'Perfect Score', description: 'Complete a lesson with 100% accuracy', icon: '💯', xpReward: 30, coinReward: 15, category: 'mastery' },
      { key: 'streak_30', title: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🌟', xpReward: 200, coinReward: 100, category: 'streak' },
      { key: 'xp_500', title: 'XP Hunter', description: 'Earn 500 total XP', icon: '⚡', xpReward: 0, coinReward: 50, category: 'learning' },
      { key: 'lesson_10', title: 'Dedicated Learner', description: 'Complete 10 lessons', icon: '📖', xpReward: 40, coinReward: 20, category: 'learning' },
      { key: 'coins_100', title: 'Coin Collector', description: 'Accumulate 100 coins', icon: '🪙', xpReward: 15, coinReward: 0, category: 'learning' },
    ];

    for (const ach of defaultAchievements) {
      const exists = await db.achievement.findUnique({ where: { key: ach.key } });
      if (!exists) {
        await db.achievement.create({ data: ach });
      }
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}