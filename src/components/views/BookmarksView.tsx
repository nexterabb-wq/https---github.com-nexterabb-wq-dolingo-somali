'use client';

import { motion } from 'framer-motion';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigationStore } from '@/stores/navigation-store';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function BookmarksView() {
  const navigate = useNavigationStore((s) => s.navigate);

  return (
    <motion.main
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="px-4 py-6 pb-24 md:pb-6 max-w-2xl mx-auto space-y-4"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <button
          onClick={() => navigate('dashboard')}
          className="flex items-center justify-center size-10 rounded-xl hover:bg-accent transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Bookmark className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Bookmarks</h1>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="vocabulary" className="w-full">
          <TabsList className="w-full h-11 rounded-xl bg-muted/60">
            <TabsTrigger
              value="vocabulary"
              className="flex-1 rounded-lg text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Vocabulary
            </TabsTrigger>
            <TabsTrigger
              value="lessons"
              className="flex-1 rounded-lg text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Lessons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vocabulary" className="mt-4">
            <VocabularyTab />
          </TabsContent>

          <TabsContent value="lessons" className="mt-4">
            <LessonsTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center size-20 rounded-full bg-muted mb-4">
        <Bookmark className="size-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No bookmarks yet!</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Bookmark vocabulary and lessons to review later.
      </p>
    </div>
  );
}

function VocabularyTab() {
  // Mock empty state for now
  return <EmptyState />;
}

function LessonsTab() {
  // Mock empty state for now
  return <EmptyState />;
}
