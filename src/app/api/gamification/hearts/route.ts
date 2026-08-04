import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const REFILL_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Find or create hearts record
    let hearts = await db.hearts.findUnique({
      where: { userId },
    });

    if (!hearts) {
      hearts = await db.hearts.create({
        data: { userId, current: 5, maxHearts: 5, lastRefillAt: new Date() },
      });
      return NextResponse.json({
        current: hearts.current,
        max: hearts.maxHearts,
        lastRefillAt: hearts.lastRefillAt,
        message: 'Hearts record created',
      });
    }

    // Already at max hearts
    if (hearts.current >= hearts.maxHearts) {
      return NextResponse.json({
        current: hearts.current,
        max: hearts.maxHearts,
        lastRefillAt: hearts.lastRefillAt,
        message: 'Hearts are already full',
      });
    }

    // Check if 30 minutes have passed since last refill
    const now = new Date();
    const elapsed = now.getTime() - new Date(hearts.lastRefillAt).getTime();

    if (elapsed < REFILL_COOLDOWN_MS) {
      const remainingMs = REFILL_COOLDOWN_MS - elapsed;
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      return NextResponse.json(
        {
          current: hearts.current,
          max: hearts.maxHearts,
          lastRefillAt: hearts.lastRefillAt,
          message: `Hearts will refill in ${remainingMinutes} minute(s)`,
          retryAfterMs: remainingMs,
        },
        { status: 429 },
      );
    }

    // Refill hearts to max
    const updated = await db.hearts.update({
      where: { userId },
      data: {
        current: hearts.maxHearts,
        lastRefillAt: now,
      },
    });

    return NextResponse.json({
      current: updated.current,
      max: updated.maxHearts,
      lastRefillAt: updated.lastRefillAt,
      message: 'Hearts refilled successfully',
    });
  } catch (error) {
    console.error('[POST /api/gamification/hearts] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
