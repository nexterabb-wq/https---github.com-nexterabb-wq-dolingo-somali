'use client';

import type { Exercise } from '@/types';
import MultipleChoiceExercise from './MultipleChoiceExercise';
import FillBlankExercise from './FillBlankExercise';
import MatchWordExercise from './MatchWordExercise';
import TypingExercise from './TypingExercise';
import SentenceOrderingExercise from './SentenceOrderingExercise';
import TranslationExercise from './TranslationExercise';

interface ExerciseRendererProps {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}

export default function ExerciseRenderer({
  exercise,
  onAnswer,
  answered,
}: ExerciseRendererProps) {
  switch (exercise.exerciseType) {
    case 'multiple_choice':
      return <MultipleChoiceExercise exercise={exercise} onAnswer={onAnswer} answered={answered} />;
    case 'fill_blank':
      return <FillBlankExercise exercise={exercise} onAnswer={onAnswer} answered={answered} />;
    case 'match_word':
      return <MatchWordExercise exercise={exercise} onAnswer={onAnswer} answered={answered} />;
    case 'typing':
      return <TypingExercise exercise={exercise} onAnswer={onAnswer} answered={answered} />;
    case 'sentence_ordering':
      return <SentenceOrderingExercise exercise={exercise} onAnswer={onAnswer} answered={answered} />;
    case 'translation':
      return <TranslationExercise exercise={exercise} onAnswer={onAnswer} answered={answered} />;
    case 'listening':
    case 'speaking':
    case 'image_selection':
      return (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-center px-4">
          <div>
            <p className="text-lg font-medium mb-2">
              🚧 Exercise type not yet implemented
            </p>
            <p className="text-sm">{exercise.exerciseType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-center px-4">
          <div>
            <p className="text-lg font-medium mb-2">
              🚧 Exercise type not yet implemented
            </p>
            <p className="text-sm">Unknown type</p>
          </div>
        </div>
      );
  }
}
