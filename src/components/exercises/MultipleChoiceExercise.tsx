'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import type { Exercise, MultipleChoiceConfig } from '@/types';

interface MultipleChoiceExerciseProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

function isMultipleChoiceConfig(config: unknown): config is MultipleChoiceConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'question' in config &&
    'options' in config &&
    'correctIndex' in config
  );
}

export default function MultipleChoiceExercise({
  exercise,
  onAnswer,
  answered,
}: MultipleChoiceExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!isMultipleChoiceConfig(exercise.config)) {
    return <p className="text-destructive">Invalid exercise configuration.</p>;
  }

  const config = exercise.config;
  const correctIndex = config.correctIndex;
  const isCorrect = selectedIndex === correctIndex;

  function handleSelect(index: number) {
    if (answered) return;
    setSelectedIndex(index);
    onAnswer(index === correctIndex);
  }

  function getButtonStyle(index: number) {
    if (!answered && selectedIndex === index) {
      return isCorrect
        ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
        : 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100';
    }
    if (answered) {
      if (index === correctIndex) {
        return 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100';
      }
      if (index === selectedIndex && !isCorrect) {
        return 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100 opacity-70';
      }
      return 'border-border bg-muted/50 text-muted-foreground opacity-60';
    }
    return 'border-border bg-card text-card-foreground hover:border-primary/50 hover:bg-accent cursor-pointer';
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-4">
      {config.somaliPrompt && (
        <p className="text-muted-foreground text-sm text-center">
          {config.somaliPrompt}
        </p>
      )}

      <h2 className="text-2xl sm:text-3xl font-bold text-center leading-tight">
        {config.question}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {config.options.map((option, index) => (
          <motion.div
            key={index}
            whileTap={!answered ? { scale: 0.97 } : undefined}
          >
            <Card
              className={
                `rounded-xl p-4 min-h-[44px] flex items-center justify-center text-center border-2 transition-colors select-none ${getButtonStyle(index)}`
              }
              onClick={() => handleSelect(index)}
              role="button"
              tabIndex={0}
              aria-label={`Option ${index + 1}: ${option}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleSelect(index);
              }}
            >
              <span className="text-base sm:text-lg font-medium">
                {option}
              </span>
            </Card>
          </motion.div>
        ))}
      </div>

      {answered && config.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground border"
        >
          <span className="font-semibold text-foreground">Explanation: </span>
          {config.explanation}
        </motion.div>
      )}
    </div>
  );
}
