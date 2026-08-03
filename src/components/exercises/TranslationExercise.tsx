'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Exercise, TranslationConfig } from '@/types';

interface TranslationExerciseProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

function isTranslationConfig(config: unknown): config is TranslationConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'sourceText' in config &&
    'targetLang' in config &&
    'answer' in config
  );
}

export default function TranslationExercise({
  exercise,
  onAnswer,
  answered,
}: TranslationExerciseProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  if (!isTranslationConfig(exercise.config)) {
    return <p className="text-destructive">Invalid exercise configuration.</p>;
  }

  const config = exercise.config;
  const hasOptions = !!(config.options && config.options.length > 0);
  const isCorrect = hasOptions
    ? selectedOption?.trim().toLowerCase() === config.answer.trim().toLowerCase()
    : inputValue.trim().toLowerCase() === config.answer.trim().toLowerCase();

  function handleOptionClick(option: string) {
    if (answered) return;
    setSelectedOption(option);
    onAnswer(option.trim().toLowerCase() === config.answer.trim().toLowerCase());
  }

  function handleSubmit() {
    if (answered || !inputValue.trim()) return;
    onAnswer(
      inputValue.trim().toLowerCase() === config.answer.trim().toLowerCase()
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-4">
      <h2 className="text-2xl sm:text-3xl font-bold text-center leading-tight">
        {config.sourceText}
      </h2>

      <p className="text-muted-foreground text-center">
        Translate to {config.targetLang}
      </p>

      {hasOptions ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {config.options!.map((option, index) => {
            const isThisCorrect =
              option.trim().toLowerCase() === config.answer.trim().toLowerCase();
            let style =
              'border-border bg-card text-card-foreground hover:border-primary/50 hover:bg-accent cursor-pointer';
            if (answered) {
              if (isThisCorrect) {
                style =
                  'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100';
              } else if (selectedOption === option && !isCorrect) {
                style =
                  'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100 opacity-70';
              } else {
                style =
                  'border-border bg-muted/50 text-muted-foreground opacity-60';
              }
            }
            return (
              <motion.div
                key={index}
                whileTap={!answered ? { scale: 0.97 } : undefined}
              >
                <Card
                  className={`rounded-xl p-4 min-h-[44px] flex items-center justify-center text-center border-2 transition-colors select-none ${style}`}
                  onClick={() => handleOptionClick(option)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Option: ${option}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ')
                      handleOptionClick(option);
                  }}
                >
                  <span className="font-medium">{option}</span>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={answered}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="Type your translation..."
              className={`h-12 sm:h-14 text-lg text-center rounded-xl ${
                answered
                  ? isCorrect
                    ? 'border-green-500 focus-visible:ring-green-500'
                    : 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }`}
              aria-label="Type your translation"
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
          {!answered && (
            <Button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="min-h-[44px] rounded-xl px-8"
              size="lg"
            >
              Check
            </Button>
          )}
        </div>
      )}

      {answered && !isCorrect && (
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
