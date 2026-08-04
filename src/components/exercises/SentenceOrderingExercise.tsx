'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Exercise, SentenceOrderingConfig } from '@/types';

interface SentenceOrderingExerciseProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

function isSentenceOrderingConfig(
  config: unknown
): config is SentenceOrderingConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'words' in config &&
    'correctOrder' in config &&
    Array.isArray((config as SentenceOrderingConfig).words)
  );
}

interface WordItem {
  word: string;
  originalIndex: number;
}

function getWords(config: unknown): string[] {
  if (isSentenceOrderingConfig(config)) return config.words;
  return [];
}

function getCorrectOrder(config: unknown): number[] {
  if (isSentenceOrderingConfig(config)) return config.correctOrder;
  return [];
}

function getTranslation(config: unknown): string | undefined {
  if (isSentenceOrderingConfig(config)) return config.translation;
  return undefined;
}

function getSomaliTranslation(config: unknown): string | undefined {
  if (isSentenceOrderingConfig(config)) return config.somaliTranslation;
  return undefined;
}

export default function SentenceOrderingExercise({
  exercise,
  onAnswer,
  answered,
}: SentenceOrderingExerciseProps) {
  const words = useMemo(() => getWords(exercise.config), [exercise.config]);
  const correctOrder = useMemo(() => getCorrectOrder(exercise.config), [exercise.config]);
  const translation = getTranslation(exercise.config);
  const somaliTranslation = getSomaliTranslation(exercise.config);

  const [availableWords, setAvailableWords] = useState<WordItem[]>(
    () =>
      words.map((w, i) => ({ word: w, originalIndex: i }))
  );
  const [selectedOrder, setSelectedOrder] = useState<WordItem[]>([]);
  const [checkedResult, setCheckedResult] = useState<
    'correct' | 'wrong' | null
  >(null);

  const isCorrectOrder =
    selectedOrder.length === correctOrder.length &&
    selectedOrder.every(
      (item, i) => item.originalIndex === correctOrder[i]
    );

  const handleWordClick = useCallback(
    (wordItem: WordItem) => {
      if (answered) return;
      setAvailableWords((prev) =>
        prev.filter((w) => w.originalIndex !== wordItem.originalIndex)
      );
      setSelectedOrder((prev) => [...prev, wordItem]);
    },
    [answered]
  );

  const handleRemoveWord = useCallback(
    (originalIndex: number) => {
      if (answered) return;
      const removed = selectedOrder.find(
        (w) => w.originalIndex === originalIndex
      );
      if (!removed) return;
      setSelectedOrder((prev) =>
        prev.filter((w) => w.originalIndex !== originalIndex)
      );
      setAvailableWords((prev) => {
        const insertAt = prev.findIndex(
          (w) => w.originalIndex > originalIndex
        );
        const newArr = [...prev];
        if (insertAt === -1) {
          newArr.push(removed);
        } else {
          newArr.splice(insertAt, 0, removed);
        }
        return newArr;
      });
    },
    [answered, selectedOrder]
  );

  const handleCheck = () => {
    if (answered || selectedOrder.length === 0) return;
    const result = isCorrectOrder ? 'correct' : 'wrong';
    setCheckedResult(result);
    onAnswer(isCorrectOrder);
  };

  if (!isSentenceOrderingConfig(exercise.config)) {
    return <p className="text-destructive">Invalid exercise configuration.</p>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-4">
      {somaliTranslation && (
        <p className="text-muted-foreground text-sm text-center">
          {somaliTranslation}
        </p>
      )}

      {translation && (
        <p className="text-muted-foreground text-sm text-center">
          {translation}
        </p>
      )}

      <h2 className="text-lg font-semibold text-center">
        Put the words in the correct order
      </h2>

      {/* Answer slots */}
      <div className="min-h-[64px] flex flex-wrap gap-2 justify-center p-3 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20">
        <AnimatePresence mode="popLayout">
          {selectedOrder.length === 0 ? (
            <motion.span
              key="placeholder"
              className="text-muted-foreground/50 text-sm self-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Tap words below to build the sentence
            </motion.span>
          ) : (
            selectedOrder.map((item) => {
              const isWrongSlot =
                answered &&
                checkedResult === 'wrong' &&
                item.originalIndex !==
                  correctOrder[selectedOrder.indexOf(item)];
              const isCorrectSlot =
                answered &&
                item.originalIndex ===
                  correctOrder[selectedOrder.indexOf(item)];

              return (
                <motion.div
                  key={item.originalIndex}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Card
                    className={`rounded-xl px-4 py-2 min-h-[44px] flex items-center justify-center border-2 cursor-pointer select-none transition-colors ${
                      isWrongSlot
                        ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
                        : isCorrectSlot
                          ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                          : 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                    onClick={() => handleRemoveWord(item.originalIndex)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove: ${item.word}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        handleRemoveWord(item.originalIndex);
                    }}
                  >
                    <span className="font-medium text-sm sm:text-base">
                      {item.word}
                    </span>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Available word buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <AnimatePresence mode="popLayout">
          {availableWords.map((item) => (
            <motion.div
              key={item.originalIndex}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Card
                className="rounded-xl px-4 py-2 min-h-[44px] flex items-center justify-center border-2 border-border bg-card text-card-foreground hover:border-primary/50 hover:bg-accent cursor-pointer select-none transition-colors"
                onClick={() => handleWordClick(item)}
                role="button"
                tabIndex={0}
                aria-label={`Add: ${item.word}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    handleWordClick(item);
                }}
              >
                <span className="font-medium text-sm sm:text-base">
                  {item.word}
                </span>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Check button */}
      {!answered && selectedOrder.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={handleCheck}
            className="min-h-[44px] rounded-xl px-8"
            size="lg"
          >
            Check
          </Button>
        </div>
      )}

      {/* Show correct order if wrong */}
      {answered && checkedResult === 'wrong' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-green-700 dark:text-green-400 font-medium mb-1">
            Correct order:
          </p>
          <p className="text-muted-foreground text-sm">
            {correctOrder.map((idx) => words[idx]).join(' ')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
