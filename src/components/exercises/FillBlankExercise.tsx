'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Exercise, FillBlankConfig } from '@/types';

interface FillBlankExerciseProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

function isFillBlankConfig(config: unknown): config is FillBlankConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'sentence' in config &&
    'answer' in config
  );
}

export default function FillBlankExercise({
  exercise,
  onAnswer,
  answered,
}: FillBlankExerciseProps) {
  const [inputValue, setInputValue] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!isFillBlankConfig(exercise.config)) {
    return <p className="text-destructive">Invalid exercise configuration.</p>;
  }

  const config = exercise.config;
  const hasOptions = !!(config.options && config.options.length > 0);
  const isCorrect =
    hasOptions
      ? selectedOption?.trim().toLowerCase() === config.answer.trim().toLowerCase()
      : inputValue.trim().toLowerCase() === config.answer.trim().toLowerCase();

  function handleOptionClick(option: string) {
    if (answered) return;
    setSelectedOption(option);
    onAnswer(option.trim().toLowerCase() === config.answer.trim().toLowerCase());
  }

  function handleSubmit() {
    if (answered || !inputValue.trim()) return;
    onAnswer(inputValue.trim().toLowerCase() === config.answer.trim().toLowerCase());
  }

  function renderSentence() {
    const parts = config.sentence.split('_____');
    if (parts.length === 1) {
      return <span>{config.sentence}</span>;
    }

    return (
      <span className="text-xl sm:text-2xl font-medium leading-relaxed">
        {parts[0]}
        {hasOptions ? (
          <span
            className={`inline-block min-w-[80px] mx-1 px-3 py-1 rounded-lg border-b-2 ${
              answered
                ? isCorrect
                  ? 'border-green-500 text-green-700 dark:text-green-400'
                  : 'border-red-500 text-red-700 dark:text-red-400'
                : selectedOption
                  ? 'border-primary text-primary'
                  : 'border-dashed border-muted-foreground/50 text-muted-foreground'
            }`}
          >
            {selectedOption || '______'}
          </span>
        ) : (
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={answered}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            className={`inline-block w-32 sm:w-40 mx-1 text-center h-10 text-lg border-b-2 border-x-0 border-t-0 rounded-none focus-visible:ring-0 ${
              answered
                ? isCorrect
                  ? 'border-green-500 text-green-700 dark:text-green-400'
                  : 'border-red-500 text-red-700 dark:text-red-400'
                : ''
            }`}
            placeholder="..."
            aria-label="Fill in the blank"
          />
        )}
        {parts.slice(1).join('')}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-4">
      {config.somaliTranslation && (
        <p className="text-muted-foreground text-sm text-center">
          {config.somaliTranslation}
        </p>
      )}

      <div className="text-center">{renderSentence()}</div>

      {hasOptions ? (
        <div className="flex flex-wrap gap-3 justify-center">
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
                style = 'border-border bg-muted/50 text-muted-foreground opacity-60';
              }
            }
            return (
              <motion.div
                key={index}
                whileTap={!answered ? { scale: 0.97 } : undefined}
              >
                <Card
                  className={`rounded-xl px-5 py-3 min-h-[44px] flex items-center justify-center border-2 transition-colors select-none ${style}`}
                  onClick={() => handleOptionClick(option)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Option: ${option}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleOptionClick(option);
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
