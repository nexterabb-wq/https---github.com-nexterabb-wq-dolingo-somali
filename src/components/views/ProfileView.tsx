'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Coins, Trophy, Zap, BookOpen, LogOut, Pencil, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigationStore } from '@/stores/navigation-store';
import { useAuthStore } from '@/stores/auth-store';
import { useLessonStore } from '@/stores/lesson-store';

import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function ProfileView() {
  const navigate = useNavigationStore((s) => s.navigate);
  const { user, gamification, achievements, setGamification } = useAuthStore();
  const { progressMap } = useLessonStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const gamRes = await fetch('/api/gamification');
        if (gamRes.ok && !cancelled) {
          const gamData = await gamRes.json();
          setGamification(gamData);
        }
      } catch {
        // use store defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const stats = [
    { icon: Zap, label: 'Level', value: gamification.level, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40' },
    { icon: Star, label: 'Total XP', value: gamification.xp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { icon: Flame, label: 'Longest Streak', value: gamification.longestStreak, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40' },
    { icon: Coins, label: 'Coins', value: gamification.coins, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/40' },
    { icon: BookOpen, label: 'Lessons Done', value: completedCount, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/40' },
    { icon: Award, label: 'Achievements', value: achievements.length, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  ];

  async function handleSignOut() {
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore
    }
    useAuthStore.getState().logout();
    navigate('landing');
  }

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        <div className="flex flex-col items-center gap-3 py-4">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
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
      className="px-4 py-6 pb-24 md:pb-6 max-w-2xl mx-auto space-y-6"
    >
      {/* Avatar & Info */}
      <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 py-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white text-3xl font-bold shadow-lg shadow-green-500/25"
        >
          {initials}
        </motion.div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">{user?.name || 'Unknown User'}</h1>
          <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
        </div>
      </motion.div>

      {/* Edit Profile Button */}
      <motion.div variants={fadeUp} className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => toast.info('Coming soon!')}
          className="rounded-xl min-h-[44px] px-6 cursor-pointer"
        >
          <Pencil className="size-4" />
          Edit Profile
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div
                    className={cn(
                      'flex items-center justify-center size-10 rounded-xl',
                      stat.bg,
                      stat.color
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <p className="text-xl font-bold text-foreground leading-tight">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Sign Out */}
      <motion.div variants={fadeUp} className="flex justify-center pt-4">
        <Button
          variant="destructive"
          onClick={handleSignOut}
          className="rounded-xl min-h-[44px] px-6 cursor-pointer"
        >
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </motion.div>
    </motion.main>
  );
}
