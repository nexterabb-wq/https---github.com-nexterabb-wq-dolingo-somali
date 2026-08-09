'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Flame, Star, Trophy, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import ExerciseRenderer from '@/components/exercises/ExerciseRenderer';
import { useNavigationStore } from '@/stores/navigation-store';
import { useLessonStore } from '@/stores/lesson-store';
import { useAuthStore } from '@/stores/auth-store';
import type { Exercise, Section, Vocabulary } from '@/types';

export default function LessonView() {
  const viewParams = useNavigationStore((s) => s.viewParams);
  const navigate = useNavigationStore((s) => s.navigate);

  const {
    currentLesson,
    currentSections,
    allExercises,
    allVocabulary,
    currentSectionIndex,
    currentExerciseIndex,
    exerciseAnswers,
    heartsLost,
    xpEarned,
    isLessonComplete,
    lessonScore,
    setCurrentLesson,
    setCurrentSections,
    setAllExercises,
    setAllVocabulary,
    startLesson,
    setExerciseAnswer,
    advanceToNext,
    loseHeart,
    addXp,
    completeLesson,
    resetLesson,
    updateProgress,
  } = useLessonStore();

  const { gamification, spendHearts, addXp: addAuthXp, addCoins } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [showNoHearts, setShowNoHearts] = useState(false);
  const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived: current section and section type
  const currentSection = currentSections[currentSectionIndex] ?? null;
  const isVocabSection = currentSection?.type === 'vocabulary';

  // Derived: exercises for current section
  const sectionExercises = useMemo(() => {
    if (!currentSection) return [];
    return allExercises.filter((e) => e.sectionId === currentSection.id);
  }, [currentSection, allExercises]);

  // Derived: current exercise
  const currentExercise: Exercise | null =
    sectionExercises[currentExerciseIndex] ?? null;

  // Derived: total exercise count
  const totalExerciseCount = useMemo(() => {
    return allExercises.filter((e) =>
      currentSections.some((s) => s.id === e.sectionId)
    ).length;
  }, [allExercises, currentSections]);

  // Derived: current position (0-based) among all exercises
  const globalExercisePosition = useMemo(() => {
    let count = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      count += allExercises.filter(
        (e) => e.sectionId === currentSections[i]?.id
      ).length;
    }
    count += currentExerciseIndex;
    return count;
  }, [currentSectionIndex, currentExerciseIndex, allExercises, currentSections]);

  // Progress percentage
  const progressPercent =
    totalExerciseCount > 0
      ? ((globalExercisePosition + (answered && currentExercise ? 1 : 0)) /
          totalExerciseCount) *
        100
      : 0;

  // Reset vocabulary index when entering a vocabulary section
  useEffect(() => {
    if (isVocabSection) {
      setCurrentVocabIndex(0);
    }
  }, [isVocabSection]);

  // Fetch lesson data on mount
  useEffect(() => {
    const lessonId = viewParams.lessonId;
    if (!lessonId) {
      setLoadError('No lesson ID provided');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchLesson() {
      try {
        const res = await fetch(`/api/lessons?lessonId=${lessonId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch lesson');
        }
        const data = await res.json();

        if (cancelled) return;

        // API returns flat: { id, title, ..., sections: [{ vocabulary: [...], exercises: [...] }] }
        const lesson = data;
        const sections: Section[] = data.sections ?? [];
        const exercises: Exercise[] = sections.flatMap(
          (s: Section & { exercises?: Exercise[] }) => s.exercises ?? []
        );
        const vocabulary: Vocabulary[] = sections.flatMap(
          (s: Section & { vocabulary?: Vocabulary[] }) => s.vocabulary ?? []
        );

        setCurrentLesson(lesson);
        setCurrentSections(sections);
        setAllExercises(exercises);
        setAllVocabulary(vocabulary);
        startLesson();
        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load lesson'
          );
          setIsLoading(false);
        }
      }
    }

    fetchLesson();

    return () => {
      cancelled = true;
    };
  }, [viewParams.lessonId]);

  // Current vocabulary card data (computed before TTS hooks)
  const sectionVocab = useMemo(() => {
    if (!isVocabSection || !currentSection) return [];
    return allVocabulary.filter((v) => v.sectionId === currentSection.id);
  }, [isVocabSection, currentSection, allVocabulary]);

  const currentVocab = sectionVocab[currentVocabIndex] ?? null;

  // TTS for current vocabulary word (after currentVocab is available)
  const vocabTTS = useTTS({
    audioUrl: currentVocab?.audioUrl ?? null,
    lang: 'en-US',
    rate: 0.85,
  });

  // TTS for example sentence
  const sentenceTTS = useTTS({
    lang: 'en-US',
    rate: 0.9,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      vocabTTS.stop();
      sentenceTTS.stop();
    };
  }, [vocabTTS, sentenceTTS]);

  // Reset answered state when exercise changes
  useEffect(() => {
    setAnswered(false);
    setLastCorrect(null);
  }, [currentExercise?.id]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (!currentExercise || answered) return;

      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }

      setAnswered(true);
      setLastCorrect(correct);
      setExerciseAnswer(currentExercise.id, correct);

      if (correct) {
        addXp(currentExercise.xpReward);
      } else {
        loseHeart();
        spendHearts(1);

        // Check if hearts are depleted
        const newHeartsCount = gamification.hearts - 1;
        if (newHeartsCount <= 0) {
          setTimeout(() => setShowNoHearts(true), 800);
        }
      }

      // Auto-advance on correct after 1s
      if (correct) {
        advanceTimerRef.current = setTimeout(() => {
          try {
            clearTimeout(advanceTimerRef.current);
            advanceTimerRef.current = null;

            const hasMore = advanceToNext();
            if (!hasMore) {
              finishLesson();
            }
          } catch (error) {
            console.error('Failed to auto-advance after correct answer:', error);
          }
        }, 1000);
      }
    },
    [
      currentExercise,
      answered,
      addXp,
      loseHeart,
      spendHearts,
      gamification.hearts,
      setExerciseAnswer,
      advanceToNext,
      finishLesson,
    ]
  );

  const handleContinue = useCallback(() => {
    if (isVocabSection) {
      const sectionVocab = allVocabulary.filter(
        (v) => v.sectionId === currentSection?.id
      );
      if (currentVocabIndex < sectionVocab.length - 1) {
        setCurrentVocabIndex((prev) => prev + 1);
      } else {
        const hasMore = advanceToNext();
        if (!hasMore) {
          finishLesson();
        }
      }
      return;
    }

    // For wrong answers - advance to next
    const hasMore = advanceToNext();
    if (!hasMore) {
      finishLesson();
    }
  }, [isVocabSection, currentVocabIndex, currentSection, allVocabulary, advanceToNext]);

  const finishLesson = useCallback(async () => {
    const totalExercises = totalExerciseCount;
    const correctCount = Array.from(exerciseAnswers.values()).filter(
      (v) => v === true
    ).length;
    const score =
      totalExercises > 0
        ? Math.round((correctCount / totalExercises) * 100)
        : 0;

    completeLesson(score);
    addAuthXp(xpEarned);
    addCoins(Math.floor(xpEarned / 10));

    // Update local progress map immediately
    const lessonId = viewParams.lessonId;
    if (lessonId) {
      updateProgress(lessonId, {
        completed: true,
        score,
        completedAt: new Date().toISOString(),
      });
    }

    // POST progress to API
    try {
      if (lessonId) {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            score,
            xpEarned,
          }),
        });
      }
    } catch {
      // Silent fail for progress reporting
    }
  }, [totalExerciseCount, exerciseAnswers, xpEarned, viewParams.lessonId, completeLesson, addAuthXp, addCoins, updateProgress]);

  const handleClose = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    resetLesson();
    navigate('learning-path');
  }, [resetLesson, navigate]);

  const handleTryLater = useCallback(() => {
    setShowNoHearts(false);
    resetLesson();
    navigate('dashboard');
  }, [resetLesson, navigate]);

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive font-medium">{loadError}</p>
          <Button onClick={handleClose} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // --- Completion screen ---
  if (isLessonComplete) {
    const coinsEarned = Math.floor(xpEarned / 10);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 max-w-sm w-full"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-3xl font-bold text-center">Lesson Complete!</h1>

          <Card className="w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Score</span>
              <span className="text-2xl font-bold">{lessonScore}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Flame className="w-4 h-4" /> XP Earned
              </span>
              <span className="text-xl font-semibold text-orange-500">
                +{xpEarned}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Star className="w-4 h-4" /> Coins
              </span>
              <span className="text-xl font-semibold text-yellow-500">
                +{coinsEarned}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Hearts Lost</span>
              <span
                className={`text-xl font-semibold ${heartsLost > 0 ? 'text-red-500' : 'text-green-500'}`}
              >
                {heartsLost}
              </span>
            </div>
          </Card>

          <Button
            onClick={() => {
              resetLesson();
              navigate('learning-path');
            }}
            className="w-full min-h-[48px] rounded-xl text-lg"
            size="lg"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // --- Vocabulary section ---
  if (isVocabSection && currentVocab) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close lesson"
          >
            <X className="w-6 h-6" />
          </button>
          <Progress value={progressPercent} className="flex-1 mx-4" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-red-500">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {gamification.hearts}
              </span>
            </div>
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-5 h-5" />
              <span className="text-sm font-semibold">{gamification.xp}</span>
            </div>
          </div>
        </header>

        {/* Main vocabulary card area */}
        <main className="flex-1 flex items-center justify-center px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVocab.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md"
            >
              <Card className="p-6 sm:p-8 space-y-4">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-3xl font-bold">{currentVocab.english}</h2>
                    {vocabTTS.isSupported ? (
                      <button
                        type="button"
                        onClick={() => vocabTTS.speak(currentVocab.english)}
                        className="p-1.5 rounded-full hover:bg-accent transition-colors text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={vocabTTS.isSpeaking ? 'Stop audio' : 'Play pronunciation'}
                        title={vocabTTS.provider === 'browser-tts' ? 'Browser TTS' : vocabTTS.provider === 'audio-url' ? 'Recorded audio' : 'Play pronunciation'}
                      >
                        {vocabTTS.isSpeaking ? (
                          <VolumeX className="size-5 animate-pulse" />
                        ) : (
                          <Volume2 className="size-5" />
                        )}
                      </button>
                    ) : (
                      <span className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center" title="Audio not supported">
                        <Volume2 className="size-5 text-muted-foreground/30" />
                      </span>
                    )}
                  </div>
                  <p className="text-xl text-primary font-medium">
                    {currentVocab.somali}
                  </p>
                  {currentVocab.pronunciationGuide && (
                    <p className="text-muted-foreground text-sm">
                      {currentVocab.pronunciationGuide}
                    </p>
                  )}
                  {currentVocab.partOfSpeech && (
                    <span className="inline-block text-xs bg-muted rounded-full px-3 py-1 text-muted-foreground">
                      {currentVocab.partOfSpeech}
                    </span>
                  )}
                </div>

                {currentVocab.exampleSentence && (
                  <div className="mt-4 pt-4 border-t space-y-1">
                    <p className="text-sm text-foreground flex items-start gap-1">
                      {sentenceTTS.isSupported ? (
                        <button
                          type="button"
                          onClick={() => sentenceTTS.speak(currentVocab.exampleSentence!)}
                          className="shrink-0 mt-0.5 p-1 rounded-full hover:bg-accent transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          aria-label={sentenceTTS.isSpeaking ? 'Stop sentence audio' : 'Play example sentence'}
                        >
                          {sentenceTTS.isSpeaking ? (
                            <VolumeX className="size-3.5 animate-pulse text-primary" />
                          ) : (
                            <Volume2 className="size-3.5 text-primary" />
                          )}
                        </button>
                      ) : (
                        <Volume2 className="size-3.5 mt-0.5 shrink-0 text-muted-foreground/30" />
                      )}
                      <span>{currentVocab.exampleSentence}</span>
                    </p>
                    {currentVocab.exampleTranslation && (
                      <p className="text-sm text-muted-foreground">
                        {currentVocab.exampleTranslation}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom bar */}
        <footer className="px-4 pb-6 pt-3">
          <div className="flex items-center justify-between max-w-md mx-auto text-sm text-muted-foreground mb-3">
            <span>
              {currentVocabIndex + 1} / {sectionVocab.length}
            </span>
          </div>
          <Button
            onClick={handleContinue}
            className="w-full max-w-md mx-auto flex min-h-[48px] rounded-xl text-lg bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            Continue
          </Button>
        </footer>
      </div>
    );
  }

  // --- Exercise section ---
  if (currentExercise) {
    const showContinueButton = answered && lastCorrect === false;

    return (
      <div className="min-h-screen flex flex-col bg-background relative">
        {/* Green/red flash overlay */}
        <AnimatePresence>
          {answered && lastCorrect !== null && (
            <motion.div
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className={`absolute inset-0 z-0 pointer-events-none ${
                lastCorrect
                  ? 'bg-green-400 dark:bg-green-600'
                  : 'bg-red-400 dark:bg-red-600'
              }`}
            />
          )}
        </AnimatePresence>

        {/* Top bar */}
        <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b">
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close lesson"
          >
            <X className="w-6 h-6" />
          </button>
          <Progress value={progressPercent} className="flex-1 mx-4" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-red-500">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {gamification.hearts}
              </span>
            </div>
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-5 h-5" />
              <span className="text-sm font-semibold">{gamification.xp}</span>
            </div>
          </div>
        </header>

        {/* Main exercise area */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentExercise.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <ExerciseRenderer
                exercise={currentExercise}
                onAnswer={handleAnswer}
                answered={answered}
              />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom bar */}
        <footer className="relative z-10 px-4 pb-6 pt-3">
          <AnimatePresence mode="wait">
            {showContinueButton && (
              <motion.div
                key="continue-btn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Button
                  onClick={handleContinue}
                  className="w-full max-w-md mx-auto flex min-h-[48px] rounded-xl text-lg bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  Continue
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </footer>

        {/* No hearts modal */}
        <Dialog open={showNoHearts} onOpenChange={setShowNoHearts}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                No more hearts!
              </DialogTitle>
              <DialogDescription>
                You&apos;ve run out of hearts. Take a break and come back
                later to continue learning.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center gap-2">
              <Button
                onClick={handleTryLater}
                className="min-h-[44px] rounded-xl px-6"
              >
                Try Again Later
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Fallback: no exercise and not vocab (shouldn't normally happen)
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close lesson"
        >
          <X className="w-6 h-6" />
        </button>
        <Progress value={0} className="flex-1 mx-4" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-red-500">
            <Heart className="w-5 h-5" />
            <span className="text-sm font-semibold">
              {gamification.hearts}
            </span>
          </div>
          <div className="flex items-center gap-1 text-orange-500">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-semibold">{gamification.xp}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <p className="text-muted-foreground">No content available</p>
      </main>
    </div>
  );
}
