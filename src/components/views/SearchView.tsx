'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, ArrowLeft, BookOpen, Volume2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigationStore } from '@/stores/navigation-store';

interface SearchResult {
  vocabulary?: {
    id: string;
    english: string;
    somali: string;
    pronunciationGuide: string | null;
    partOfSpeech: string | null;
  }[];
  lessons?: {
    id: string;
    title: string;
    unitName: string;
  }[];
}

const popularWords = [
  { english: 'Hello', somali: 'Salaan', pronunciation: 'sah-LAHN', partOfSpeech: 'interjection' },
  { english: 'Thank you', somali: 'Waad mahadsantihiin', pronunciation: 'wahd mah-hahd-san-teen', partOfSpeech: 'phrase' },
  { english: 'Please', somali: 'Fadlan', pronunciation: 'FAHD-lan', partOfSpeech: 'adverb' },
  { english: 'Good morning', somali: 'Subax wanaagsan', pronunciation: 'soo-bah wah-naag-san', partOfSpeech: 'phrase' },
  { english: 'Goodbye', somali: 'Nabad gelyo', pronunciation: 'nah-bahd geh-lyo', partOfSpeech: 'phrase' },
  { english: 'Water', somali: 'Biyo', pronunciation: 'BEE-yo', partOfSpeech: 'noun' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function SearchView() {
  const navigate = useNavigationStore((s) => s.navigate);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-focus input
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Debounce
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!query.trim()) {
      setDebouncedQuery('');
      setResults(null);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Fetch results
  const fetchResults = useCallback(async (q: string) => {
    if (!q) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults(null);
      }
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  const hasVocabResults = results?.vocabulary && results.vocabulary.length > 0;
  const hasLessonResults = results?.lessons && results.lessons.length > 0;
  const hasNoResults = debouncedQuery && !loading && !hasVocabResults && !hasLessonResults;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 pb-24 md:pb-6 max-w-2xl mx-auto space-y-4"
    >
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('dashboard')}
          className="flex items-center justify-center size-10 rounded-xl hover:bg-accent transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Search</h1>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search vocabulary or lessons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 rounded-xl text-base bg-card border-border/60"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="size-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No Results */}
      {hasNoResults && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex items-center justify-center size-16 rounded-full bg-muted mb-3">
            <SearchIcon className="size-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No results found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try searching for a different word or phrase.
          </p>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {results && !loading && (
          <motion.div
            key={debouncedQuery}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Vocabulary Results */}
            {hasVocabResults && (
              <section>
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Vocabulary
                </h2>
                <div className="space-y-2">
                  {results.vocabulary!.map((word) => (
                    <Card key={word.id} className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-foreground">{word.english}</p>
                          <p className="text-sm text-muted-foreground">{word.somali}</p>
                          {word.pronunciationGuide && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Volume2 className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground italic">{word.pronunciationGuide}</span>
                            </div>
                          )}
                        </div>
                        {word.partOfSpeech && (
                          <Badge variant="secondary" className="shrink-0 text-[10px] font-semibold border-0 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                            {word.partOfSpeech}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Lesson Results */}
            {hasLessonResults && (
              <section>
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Lessons
                </h2>
                <div className="space-y-2">
                  {results.lessons!.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => navigate('lesson', { lessonId: lesson.id })}
                      className="w-full text-left"
                    >
                      <Card className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="flex items-center justify-center size-10 rounded-xl bg-green-50 dark:bg-green-900/20 shrink-0">
                            <BookOpen className="size-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{lesson.unitName}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popular Words - shown when no query */}
      {!debouncedQuery && !loading && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Popular Words
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {popularWords.map((word) => (
              <motion.div key={word.english} variants={fadeUp}>
                <Card className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-foreground">{word.english}</p>
                        <p className="text-sm text-muted-foreground">{word.somali}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Volume2 className="size-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground italic">{word.pronunciation}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[10px] font-semibold border-0 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                        {word.partOfSpeech}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.main>
  );
}
