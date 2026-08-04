'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Play, BookOpen } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigationStore } from '@/stores/navigation-store';
import { useLessonStore } from '@/stores/lesson-store';
import type { Course, Lesson } from '@/types';
import { cn } from '@/lib/utils';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function LearningPathView() {
  const navigate = useNavigationStore((s) => s.navigate);
  const { courses, setCourses, progressMap } = useLessonStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      if (courses.length > 0) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/courses');
        if (res.ok && !cancelled) {
          const data: Course[] = await res.json();
          setCourses(data);
        }
      } catch {
        // use defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCourses();
    return () => { cancelled = true; };
  }, []);

  const course = courses[0] || null;

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="px-4 py-16 max-w-2xl mx-auto text-center">
        <BookOpen className="size-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No courses available</h2>
        <p className="text-muted-foreground">Check back later for new learning content.</p>
      </div>
    );
  }

  // Determine lesson accessibility
  function isLessonAccessible(unitLessons: Lesson[], index: number): boolean {
    if (index === 0) return true;
    const prevLesson = unitLessons[index - 1];
    return !!progressMap[prevLesson.id]?.completed;
  }

  // Get completed count per unit
  function getUnitCompleted(lessons: Lesson[]): number {
    return lessons.filter((l) => progressMap[l.id]?.completed).length;
  }

  return (
    <motion.main
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="px-4 py-6 pb-24 md:pb-6 max-w-2xl mx-auto space-y-4"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{course.title}</h1>
        {course.description && (
          <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
        )}
      </motion.div>

      {/* Timeline with Accordion Units */}
      <div className="relative">
        {/* Vertical timeline line */}
        {course.units && course.units.length > 1 && (
          <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-green-200 dark:bg-green-900/50" aria-hidden="true" />
        )}

        <Accordion type="multiple" className="space-y-0">
          {course.units?.map((unit, unitIdx) => {
            const lessons = unit.lessons || [];
            const completedCount = getUnitCompleted(lessons);
            const totalCount = lessons.length;
            const isAllDone = completedCount === totalCount && totalCount > 0;

            return (
              <motion.div key={unit.id} variants={fadeUp}>
                <AccordionItem value={unit.id} className="border-0">
                  <AccordionTrigger className="py-4 px-2 hover:no-underline group">
                    <div className="flex items-center gap-3">
                      {/* Timeline node */}
                      <div
                        className={cn(
                          'relative z-10 flex size-11 items-center justify-center rounded-full border-2 shrink-0 transition-colors',
                          isAllDone
                            ? 'bg-green-500 border-green-500 text-white'
                            : completedCount > 0
                              ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-600 dark:text-green-400'
                              : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                        )}
                      >
                        {isAllDone ? (
                          <Check className="size-5" />
                        ) : (
                          <span className="text-sm font-bold">{unitIdx + 1}</span>
                        )}
                      </div>

                      <div className="text-left">
                        <p className="font-semibold text-foreground text-sm sm:text-base group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {unit.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {completedCount}/{totalCount} lessons completed
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    {/* Horizontal scrollable lesson nodes */}
                    <div className="pl-2 sm:pl-6 pb-2">
                      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
                        {lessons.map((lesson, lessonIdx) => {
                          const isCompleted = !!progressMap[lesson.id]?.completed;
                          const isAccessible = isLessonAccessible(lessons, lessonIdx);
                          const isCurrent = isAccessible && !isCompleted;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                if (isAccessible) {
                                  navigate('lesson', { lessonId: lesson.id });
                                }
                              }}
                              disabled={!isAccessible}
                              className={cn(
                                'flex flex-col items-center gap-2 shrink-0 min-w-[80px] cursor-pointer group/lesson transition-opacity',
                                !isAccessible && 'opacity-50 cursor-not-allowed'
                              )}
                              aria-label={
                                isCompleted
                                  ? `${lesson.title} - completed`
                                  : isAccessible
                                    ? `Start ${lesson.title}`
                                    : `${lesson.title} - locked`
                              }
                            >
                              {/* Circle Node */}
                              <div
                                className={cn(
                                  'flex items-center justify-center size-14 rounded-full border-3 transition-all',
                                  isCompleted &&
                                    'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25',
                                  isCurrent &&
                                    'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-600 dark:text-green-400 ring-2 ring-green-400/40 ring-offset-2 ring-offset-background',
                                  !isAccessible &&
                                    'bg-muted border-muted-foreground/20 text-muted-foreground'
                                )}
                              >
                                {isCompleted ? (
                                  <Check className="size-6" />
                                ) : isCurrent ? (
                                  <Play className="size-6 ml-0.5" />
                                ) : (
                                  <Lock className="size-5" />
                                )}
                              </div>

                              {/* Lesson title */}
                              <span className="text-[11px] text-center font-medium text-muted-foreground max-w-[80px] leading-tight">
                                {lesson.title}
                              </span>

                              {/* XP hint */}
                              <span className="text-[10px] text-muted-foreground/60">
                                +{lesson.xpReward} XP
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            );
          })}
        </Accordion>
      </div>
    </motion.main>
  );
}
