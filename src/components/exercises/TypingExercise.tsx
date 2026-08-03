'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Exercise, TypingConfig } from '@/types';

interface TypingExerciseProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

function isTypingConfig(config: unknown): config is TypingConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'prompt' in config &&
    'answer' in config
  );
}

export default function TypingExercise({
  exercise,
  onAnswer,
  answered,
}: TypingExerciseProps) {
  const [inputValue, setInputValue] = useState('');
  const [showHint, setShowHint] = useState(false);

  if (!isTypingConfig(exercise.config)) {
    return <p className="text-destructive">Invalid exercise configuration.</p>;
  }

  const config = exercise.config;

  function checkAnswer() {
    if (answered || !inputValue.trim()) return;

    const userAnswer = inputValue.trim().toLowerCase();
    const correctAnswer = config.answer.trim().toLowerCase();

    let isCorrect: boolean;
    if (config.acceptPartial) {
      isCorrect = correctAnswer.includes(userAnswer);
    } else {
      isCorrect = userAnswer === correctAnswer;
    }

    onAnswer(isCorrect);
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-4">
      {config.somaliPrompt && (
        <p className="text-muted-foreground text-sm text-center">
          {config.somaliPrompt}
        </p>
      )}

      <h2 className="text-2xl sm:text-3xl font-bold text-center leading-tight">
        {config.prompt}
      </h2>

      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-md">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={answered}
            onKeyDown={(e) => {
              if (e.key === 'Enter') checkAnswer();
            }}
            placeholder="Type your answer..."
            className={`h-12 sm:h-14 text-lg text-center rounded-xl ${
              answered
                ? inputValue.trim().toLowerCase() ===
                  config.answer.trim().toLowerCase()
                  ? 'border-green-500 focus-visible:ring-green-500'
                  : 'border-red-500 focus-visible:ring-red-500'
                : ''
            }`}
            aria-label="Type your answer"
            autoComplete="off"
            autoCapitalize="off"
          />
        </div>

        {!answered && (
          <Button
            onClick={checkAnswer}
            disabled={!inputValue.trim()}
            className="min-h-[44px] rounded-xl px-8"
            size="lg"
          >
            Check
          </Button>
        )}
      </div>

      {answered &&
        inputValue.trim().toLowerCase() !==
          config.answer.trim().toLowerCase() && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-green-700 dark:text-green-400 font-medium"
          >
            Correct answer: {config.answer}
          </motion.p>
        )}

      {!answered && config.hint && (
        <div className="text-center">
          {showHint ? (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-muted-foreground text-sm"
            >
              💡 {config.hint}
            </motion.p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px]"
              onClick={() => setShowHint(true)}
            >
              Show Hint
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
