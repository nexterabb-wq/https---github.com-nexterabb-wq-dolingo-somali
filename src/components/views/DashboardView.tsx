'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Coins, BookOpen, Zap, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigationStore } from '@/stores/navigation-store';
import { useAuthStore } from '@/stores/auth-store';
import { useLessonStore } from '@/stores/lesson-store';
import type { Course, Lesson, UserProgressData } from '@/types';
import { cn } from '@/lib/utils';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const firePulse = {
  animate: {
    scale: [1, 1.15, 1],
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  },
};

const mockWeeklyData = [0, 15, 30, 20, 45, 35, 0];
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DashboardView() {
  const navigate = useNavigationStore((s) => s.navigate);
  const { user, gamification, setGamification } = useAuthStore();
  const { courses, setCourses, progressMap, setProgressMap } = useLessonStore();

  const [loading, setLoading] = useState(true);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        // Fetch courses if not already loaded
        if (courses.length === 0) {
          const res = await fetch('/api/courses');
          if (res.ok && !cancelled) {
            const data: Course[] = await res.json();
            setCourses(data);
          }
        }

        // Fetch progress
        const progRes = await fetch('/api/progress');
        if (progRes.ok && !cancelled) {
          const progData: UserProgressData[] = await progRes.json();
          const map: Record<string, UserProgressData> = {};
          for (const p of progData) {
            map[p.lessonId] = p;
          }
          setProgressMap(map);
        }

        // Fetch gamification
        const gamRes = await fetch('/api/gamification');
        if (gamRes.ok && !cancelled) {
          const gamData = await gamRes.json();
          setGamification(gamData);
        }
      } catch {
        // Silent fail - use defaults from store
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // Determine next lesson
  useEffect(() => {
    if (loading || courses.length === 0) return;

    const course = courses[0];
    if (!course?.units) {
      setNextLesson(null);
      return;
    }

    for (const unit of course.units) {
      if (!unit.lessons) continue;
      for (const lesson of unit.lessons) {
        const prog = progressMap[lesson.id];
        if (!prog?.completed) {
          setNextLesson(lesson);
          return;
        }
      }
    }
    setNextLesson(null);
  }, [loading, courses, progressMap]);

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;
  const todayIndex = new Date().getDay();
  const adjustedTodayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  const weeklyXp = mockWeeklyData.reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Learner';

  return (
    <motion.main
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="px-4 py-6 pb-24 md:pb-6 max-w-2xl mx-auto space-y-4"
    >
      {/* Greeting */}
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Welcome back, {firstName}!
        </h1>
        <motion.span
          className="text-3xl inline-block origin-bottom"
          animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
          transition={{ duration: 1.5, delay: 0.3, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          👋
        </motion.span>
      </motion.div>

      {/* Continue Learning Card */}
      <motion.div variants={fadeUp}>
        <Card className="rounded-2xl overflow-hidden border-0 shadow-md">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 sm:p-6 text-white">
              <p className="text-sm font-medium text-green-100 mb-1">Continue Learning</p>
              {nextLesson ? (
                <>
                  <h2 className="text-lg font-bold mb-1">{nextLesson.title}</h2>
                  <p className="text-green-100 text-sm mb-4">
                    {nextLesson.description || 'Keep up the great work!'}
                  </p>
                  <Button
                    onClick={() => navigate('lesson', { lessonId: nextLesson.id })}
                    className="bg-white text-green-700 hover:bg-green-50 font-bold rounded-xl h-12 px-6 cursor-pointer"
                  >
                    Continue
                    <ArrowRight className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold mb-1">All caught up!</h2>
                  <p className="text-green-100 text-sm mb-4">
                    You&apos;ve completed all available lessons. Check back for more!
                  </p>
                  <Button
                    onClick={() => navigate('learning-path')}
                    className="bg-white text-green-700 hover:bg-green-50 font-bold rounded-xl h-12 px-6 cursor-pointer"
                  >
                    View Path
                    <ArrowRight className="size-4" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak + Quick Stats row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
        {/* Streak Card */}
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
            <motion.div {...firePulse}>
              <Flame className="size-10 text-orange-500" />
            </motion.div>
            <div className="text-3xl font-extrabold text-foreground">{gamification.currentStreak}</div>
            <p className="text-xs text-muted-foreground font-medium">day streak</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Keep it going!</p>
          </CardContent>
        </Card>

        {/* Weekly XP Card */}
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 flex flex-col items-center text-center gap-2">
            <Zap className="size-10 text-amber-500" />
            <div className="text-3xl font-extrabold text-foreground">{weeklyXp}</div>
            <p className="text-xs text-muted-foreground font-medium">XP this week</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Great progress!</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Activity Bar Chart */}
      <motion.div variants={fadeUp}>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-base">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-end justify-between gap-2 h-28">
              {mockWeeklyData.map((value, i) => {
                const isToday = i === adjustedTodayIndex;
                const maxVal = Math.max(...mockWeeklyData, 1);
                const heightPct = Math.max((value / maxVal) * 100, 4);
                return (
                  <div key={dayLabels[i]} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                        className={cn(
                          'w-full max-w-[32px] rounded-lg transition-colors',
                          isToday
                            ? 'bg-green-500'
                            : value > 0
                              ? 'bg-green-200 dark:bg-green-800'
                              : 'bg-muted'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-semibold',
                        isToday ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      )}
                    >
                      {dayLabels[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill icon={Star} label="Total XP" value={gamification.xp} color="text-amber-500" />
        <StatPill icon={BookOpen} label="Lessons" value={completedCount} color="text-green-500" />
        <StatPill icon={Zap} label="Level" value={gamification.level} color="text-purple-500" />
        <StatPill icon={Coins} label="Coins" value={gamification.coins} color="text-yellow-500" />
      </motion.div>
    </motion.main>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Star;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('flex items-center justify-center size-10 rounded-xl bg-muted/60', color)}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
          <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}


