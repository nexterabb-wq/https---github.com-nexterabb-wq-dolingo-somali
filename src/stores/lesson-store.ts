import { create } from 'zustand';
import type { Course, Unit, Lesson, Section, Exercise, Vocabulary, UserProgressData } from '@/types';

interface LessonState {
  // Content data
  courses: Course[];
  currentCourse: Course | null;
  currentUnit: Unit | null;
  currentLesson: Lesson | null;
  currentSections: Section[];
  allExercises: Exercise[];
  allVocabulary: Vocabulary[];

  // Progress map: lessonId -> UserProgressData
  progressMap: Record<string, UserProgressData>;

  // Lesson runner state
  currentSectionIndex: number;
  currentExerciseIndex: number;
  exerciseAnswers: Map<string, unknown>;
  lessonStartTime: number;
  heartsLost: number;
  xpEarned: number;
  isLessonComplete: boolean;
  lessonScore: number;

  // Loading
  isLoadingContent: boolean;

  // Actions
  setCourses: (courses: Course[]) => void;
  setCurrentCourse: (course: Course | null) => void;
  setCurrentUnit: (unit: Unit | null) => void;
  setCurrentLesson: (lesson: Lesson | null) => void;
  setCurrentSections: (sections: Section[]) => void;
  setAllExercises: (exercises: Exercise[]) => void;
  setAllVocabulary: (vocabulary: Vocabulary[]) => void;
  setProgressMap: (map: Record<string, UserProgressData>) => void;
  updateProgress: (lessonId: string, data: Partial<UserProgressData>) => void;

  // Lesson runner actions
  startLesson: () => void;
  setExerciseAnswer: (exerciseId: string, answer: unknown) => void;
  advanceToNext: () => boolean;
  loseHeart: () => void;
  addXp: (amount: number) => void;
  completeLesson: (score: number) => void;
  resetLesson: () => void;
  setLoadingContent: (loading: boolean) => void;
}

const initialState = {
  courses: [],
  currentCourse: null,
  currentUnit: null,
  currentLesson: null,
  currentSections: [],
  allExercises: [],
  allVocabulary: [],
  progressMap: {},
  currentSectionIndex: 0,
  currentExerciseIndex: 0,
  exerciseAnswers: new Map<string, unknown>(),
  lessonStartTime: 0,
  heartsLost: 0,
  xpEarned: 0,
  isLessonComplete: false,
  lessonScore: 0,
  isLoadingContent: false,
};

export const useLessonStore = create<LessonState>((set, get) => ({
  ...initialState,

  setCourses: (courses) => set({ courses }),
  setCurrentCourse: (course) => set({ currentCourse: course }),
  setCurrentUnit: (unit) => set({ currentUnit: unit }),
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
  setCurrentSections: (sections) => set({ currentSections: sections }),
  setAllExercises: (exercises) => set({ allExercises: exercises }),
  setAllVocabulary: (vocabulary) => set({ allVocabulary: vocabulary }),
  setProgressMap: (map) => set({ progressMap: map }),
  setLoadingContent: (loading) => set({ isLoadingContent: loading }),

  updateProgress: (lessonId, data) => set((state) => ({
    progressMap: {
      ...state.progressMap,
      [lessonId]: {
        lessonId,
        completed: false,
        score: null,
        attempts: 0,
        bestScore: null,
        completedAt: null,
        ...state.progressMap[lessonId],
        ...data,
      },
    },
  })),

  startLesson: () => set({
    currentSectionIndex: 0,
    currentExerciseIndex: 0,
    exerciseAnswers: new Map(),
    lessonStartTime: Date.now(),
    heartsLost: 0,
    xpEarned: 0,
    isLessonComplete: false,
    lessonScore: 0,
  }),

  setExerciseAnswer: (exerciseId, answer) => set((state) => {
    const newAnswers = new Map(state.exerciseAnswers);
    newAnswers.set(exerciseId, answer);
    return { exerciseAnswers: newAnswers };
  }),

  advanceToNext: () => {
    const { currentSectionIndex, currentSections, currentExerciseIndex, allExercises } = get();
    const currentSection = currentSections[currentSectionIndex];
    const sectionExercises = allExercises.filter(e => e.sectionId === currentSection?.id);

    if (currentExerciseIndex < sectionExercises.length - 1) {
      set({ currentExerciseIndex: currentExerciseIndex + 1 });
      return true;
    }
    if (currentSectionIndex < currentSections.length - 1) {
      set({
        currentSectionIndex: currentSectionIndex + 1,
        currentExerciseIndex: 0,
      });
      return true;
    }
    return false;
  },

  loseHeart: () => set((state) => ({ heartsLost: state.heartsLost + 1 })),
  addXp: (amount) => set((state) => ({ xpEarned: state.xpEarned + amount })),
  completeLesson: (score) => set({ isLessonComplete: true, lessonScore: score }),

  resetLesson: () => set({
    currentSectionIndex: 0,
    currentExerciseIndex: 0,
    exerciseAnswers: new Map(),
    lessonStartTime: 0,
    heartsLost: 0,
    xpEarned: 0,
    isLessonComplete: false,
    lessonScore: 0,
  }),
}));
