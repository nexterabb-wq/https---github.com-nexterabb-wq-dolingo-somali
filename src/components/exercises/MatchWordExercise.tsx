'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import type { Exercise, MatchWordConfig } from '@/types';

interface MatchWordExerciseProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

function isMatchWordConfig(config: unknown): config is MatchWordConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'pairs' in config &&
    Array.isArray((config as MatchWordConfig).pairs)
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getPairs(config: unknown): { english: string; somali: string }[] {
  if (isMatchWordConfig(config)) return config.pairs;
  return [];
}

function getInstruction(config: unknown): string | undefined {
  if (isMatchWordConfig(config)) return config.instruction;
  return undefined;
}

export default function MatchWordExercise({
  exercise,
  onAnswer,
  answered,
}: MatchWordExerciseProps) {
  const pairs = useMemo(() => getPairs(exercise.config), [exercise.config]);
  const instruction = getInstruction(exercise.config);

  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string | null>(null);
  const shuffledSomali = useMemo(
    () => shuffleArray(pairs.map((p) => p.somali)),
    [pairs]
  );
  const hasCompletedRef = useRef(false);

  const allMatched = matchedPairs.size === pairs.length;

  const handleEnglishClick = useCallback(
    (english: string) => {
      if (answered || matchedPairs.has(english)) return;
      setSelectedEnglish(english === selectedEnglish ? null : english);
    },
    [answered, matchedPairs, selectedEnglish]
  );

  const handleSomaliClick = useCallback(
    (somali: string) => {
      if (answered || !selectedEnglish || wrongPair) return;

      const correctSomali = pairs.find((p) => p.english === selectedEnglish)?.somali;

      if (correctSomali === somali) {
        const newMatched = new Set(matchedPairs);
        newMatched.add(selectedEnglish);
        setMatchedPairs(newMatched);
        setSelectedEnglish(null);

        if (newMatched.size === pairs.length && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setTimeout(() => onAnswer(true), 400);
        }
      } else {
        const wrongKey = `${selectedEnglish}-${somali}`;
        setWrongPair(wrongKey);
        onAnswer(false);
        setTimeout(() => {
          setWrongPair(null);
          setSelectedEnglish(null);
        }, 600);
      }
    },
    [answered, selectedEnglish, matchedPairs, wrongPair, pairs, onAnswer]
  );

  if (!isMatchWordConfig(exercise.config)) {
    return <p className="text-destructive">Invalid exercise configuration.</p>;
  }

  const config = exercise.config;

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto px-4">
      {config.instruction && (
        <p className="text-muted-foreground text-sm text-center">
          {config.instruction}
        </p>
      )}
      <p className="text-lg font-semibold text-center">
        Tap an English word, then its Somali translation
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* English column */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center mb-1">
            English
          </p>
          {config.pairs.map((pair) => {
            const isMatched = matchedPairs.has(pair.english);
            const isSelected = selectedEnglish === pair.english;
            let style =
              'border-border bg-card text-card-foreground hover:border-primary/50 hover:bg-accent cursor-pointer';
            if (isMatched) {
              style =
                'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100 opacity-70 cursor-default';
            } else if (isSelected) {
              style = 'border-primary bg-primary/10 text-primary cursor-pointer';
            }

            return (
              <Card
                key={pair.english}
                className={`rounded-xl px-3 py-3 min-h-[44px] flex items-center justify-center text-center border-2 transition-colors select-none ${style}`}
                onClick={() => handleEnglishClick(pair.english)}
                role="button"
                tabIndex={0}
                disabled={isMatched}
                aria-label={`English: ${pair.english}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    handleEnglishClick(pair.english);
                }}
              >
                <span className="text-sm sm:text-base font-medium">
                  {pair.english}
                </span>
              </Card>
            );
          })}
        </div>

        {/* Somali column (shuffled) */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center mb-1">
            Somali
          </p>
          <AnimatePresence mode="popLayout">
            {shuffledSomali.map((somali) => {
              const matchedEnglish = config.pairs.find(
                (p) => p.somali === somali && matchedPairs.has(p.english)
              );
              const isMatched = !!matchedEnglish;
              const wrongKey = `${selectedEnglish}-${somali}`;
              const isWrong = wrongPair === wrongKey;

              let style =
                'border-border bg-card text-card-foreground hover:border-primary/50 hover:bg-accent cursor-pointer';
              if (isMatched) {
                style =
                  'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100 opacity-70 cursor-default';
              }

              return (
                <motion.div
                  key={somali}
                  layout
                  animate={
                    isWrong
                      ? { x: [0, -8, 8, -8, 8, -4, 4, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.5 }}
                >
                  <Card
                    className={`rounded-xl px-3 py-3 min-h-[44px] flex items-center justify-center text-center border-2 transition-colors select-none ${
                      isWrong
                        ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
                        : style
                    }`}
                    onClick={() => handleSomaliClick(somali)}
                    role="button"
                    tabIndex={0}
                    disabled={isMatched}
                    aria-label={`Somali: ${somali}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        handleSomaliClick(somali);
                    }}
                  >
                    <span className="text-sm sm:text-base font-medium">
                      {somali}
                    </span>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {allMatched && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-green-700 dark:text-green-400 font-semibold"
        >
          All matched! 🎉
        </motion.p>
      )}
    </div>
  );
}
