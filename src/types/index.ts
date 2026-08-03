// ============================================================
// App View Routes (client-side SPA navigation)
// ============================================================

export type AppView =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'learning-path'
  | 'lesson'
  | 'profile'
  | 'achievements'
  | 'bookmarks'
  | 'review'
  | 'search'
  | 'settings';

// ============================================================
// Content Types
// ============================================================

export type ContentStatus = 'draft' | 'pending_review' | 'published';
export type ContentSource = 'human' | 'ai' | 'linguist';
export type ExerciseType =
  | 'multiple_choice'
  | 'match_word'
  | 'fill_blank'
  | 'listening'
  | 'speaking'
  | 'typing'
  | 'sentence_ordering'
  | 'translation'
  | 'image_selection';

export type SectionType = 'vocabulary' | 'grammar' | 'exercise' | 'quiz' | 'review';
export type LessonType = 'lesson' | 'quiz' | 'review';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  language: string;
  sourceLang: string;
  difficulty: string;
  sortOrder: number;
  status: ContentStatus;
  contentSource: ContentSource;
  units?: Unit[];
}

export interface Unit {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  sortOrder: number;
  status: ContentStatus;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  description: string | null;
  type: LessonType;
  xpReward: number;
  sortOrder: number;
  status: ContentStatus;
  sections?: Section[];
  // Computed
  completed?: boolean;
  progress?: number;
}

export interface Section {
  id: string;
  lessonId: string;
  title: string | null;
  type: SectionType;
  sortOrder: number;
  vocabulary?: Vocabulary[];
  exercises?: Exercise[];
}

export interface Vocabulary {
  id: string;
  sectionId: string;
  english: string;
  somali: string;
  pronunciationGuide: string | null;
  partOfSpeech: string | null;
  difficulty: Difficulty;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  grammarNotes: string | null;
  tags: string[];
  imageUrl: string | null;
  audioUrl: string | null;
  voiceType: string | null;
  audioDuration: number | null;
  audioProvider: string | null;
}

// ============================================================
// Exercise Config Types
// ============================================================

export interface MultipleChoiceConfig {
  question: string;
  questionAudioUrl?: string;
 options: string[];
  correctIndex: number;
 explanation?: string;
 somaliPrompt?: string;
}

export interface MatchWordConfig {
  pairs: { english: string; somali: string }[];
  instruction?: string;
}

export interface FillBlankConfig {
  sentence: string;
  answer: string;
  hint?: string;
  somaliTranslation?: string;
  options?: string[];
}

export interface ListeningConfig {
  audioUrl: string;
  question: string;
  options: string[];
  correctIndex: number;
  transcript?: string;
}

export interface SpeakingConfig {
  prompt: string;
  somaliPrompt?: string;
  expectedText: string;
  audioUrl?: string;
  acceptableAlternatives?: string[];
}

export interface TypingConfig {
  prompt: string;
  somaliPrompt?: string;
  answer: string;
  hint?: string;
  acceptPartial?: boolean;
}

export interface SentenceOrderingConfig {
  words: string[];
  correctOrder: number[];
  translation?: string;
  somaliTranslation?: string;
}

export interface TranslationConfig {
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  answer: string;
  options?: string[];
  hint?: string;
}

export interface ImageSelectionConfig {
  imageUrl: string;
  question: string;
  options: string[];
  correctIndex: number;
  altText?: string;
}

export type ExerciseConfig =
  | MultipleChoiceConfig
  | MatchWordConfig
  | FillBlankConfig
  | ListeningConfig
  | SpeakingConfig
  | TypingConfig
  | SentenceOrderingConfig
  | TranslationConfig
  | ImageSelectionConfig;

export interface Exercise {
  id: string;
  sectionId: string;
  exerciseType: ExerciseType;
  config: ExerciseConfig;
  xpReward: number;
  sortOrder: number;
  // Runtime state
  userAnswer?: unknown;
  isCorrect?: boolean;
}

// ============================================================
// User & Gamification Types
// ============================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
}

export interface UserProgressData {
  lessonId: string;
  completed: boolean;
  score: number | null;
  attempts: number;
  bestScore: number | null;
  completedAt: string | null;
}

export interface GamificationState {
  xp: number;
  level: number;
  hearts: number;
  maxHearts: number;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: string | null;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string | null;
  xpReward: number;
  coinReward: number;
  category: string | null;
  awardedAt?: string;
}

export interface LevelDef {
  level: number;
  title: string;
  xpRequired: number;
  icon: string | null;
}

export interface DailyStats {
  date: string;
  lessonsCompleted: number;
  exercisesCompleted: number;
  xpEarned: number;
  timeSpentSeconds: number;
  accuracy: number | null;
}

export interface WeeklyStats {
  weekStart: string;
  totalXp: number;
  totalLessons: number;
  totalExercises: number;
  totalTimeSeconds: number;
  avgAccuracy: number;
  days: DailyStats[];
}
