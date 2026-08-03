'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Coins, Lock, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import type { Achievement } from '@/types';
import { cn } from '@/lib/utils';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const achievementIcons: Record<string, string> = {
  first_lesson: '🎯',
  first_streak: '🔥',
  word_master: '📚',
  perfect_score: '⭐',
  speed_learner: '⚡',
  collector: '🏆',
  early_bird: '🌅',
  night_owl: '🦉',
  social: '🤝',
  linguist: '🧠',
};

export default function AchievementsView() {
  const { achievements, setAchievements } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAchievements() {
      // If store already has achievements, skip fetch
      if (achievements.length > 0) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/gamification');
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.achievements) {
            setAchievements(data.achievements);
          }
        }
      } catch {
        // Silent fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAchievements();
    return () => { cancelled = true; };
  }, []);

  const awardedCount = achievements.filter((a) => a.awardedAt).length;

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-6 w-64 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.main
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="px-4 py-6 pb-24 md:pb-6 max-w-2xl mx-auto space-y-4"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <Trophy className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Achievements</h1>
          <p className="text-sm text-muted-foreground">
            {awardedCount} of {achievements.length} unlocked
          </p>
        </div>
      </motion.div>

      {/* Achievement Grid */}
      {achievements.length > 0 ? (
        <motion.div
          variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center size-20 rounded-full bg-muted mb-4">
            <Award className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No achievements yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Keep learning to unlock achievements!
          </p>
        </motion.div>
      )}
    </motion.main>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isAwarded = !!achievement.awardedAt;
  const icon = achievement.icon || achievementIcons[achievement.key] || '🏅';

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div variants={fadeUp}>
      <Card
        className={cn(
          'relative rounded-2xl overflow-hidden border-2 transition-shadow hover:shadow-md',
          isAwarded
            ? 'border-green-400 dark:border-green-500'
            : 'border-transparent opacity-70'
        )}
      >
        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
          {/* Icon */}
          <div
            className={cn(
              'flex items-center justify-center size-14 rounded-2xl text-3xl mb-1',
              isAwarded
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-muted'
            )}
          >
            {icon}
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-foreground leading-tight">
            {achievement.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {achievement.description}
          </p>

          {/* Reward Badges */}
          <div className="flex items-center gap-2 mt-1">
            {achievement.xpReward > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-0"
              >
                <Star className="size-3" />
                {achievement.xpReward} XP
              </Badge>
            )}
            {achievement.coinReward > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 px-2 py-0.5 text-[10px] font-semibold bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-0"
              >
                <Coins className="size-3" />
                {achievement.coinReward}
              </Badge>
            )}
          </div>

          {/* Awarded / Locked label */}
          {isAwarded ? (
            <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">
              Awarded on {formatDate(achievement.awardedAt!)}
            </p>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
              <Lock className="size-3" />
              Locked
            </div>
          )}

          {/* Lock overlay */}
          {!isAwarded && (
            <div className="absolute inset-0 bg-background/40 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="flex items-center justify-center size-10 rounded-full bg-background/80">
                <Lock className="size-5 text-muted-foreground" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
