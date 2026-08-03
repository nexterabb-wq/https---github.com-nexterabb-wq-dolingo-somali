'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Check, X, User, Bot, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigationStore } from '@/stores/navigation-store';
import type { ContentSource } from '@/types';

interface ReviewItem {
  id: string;
  title: string;
  type: string;
  contentSource: ContentSource;
  createdAt: string;
}

interface ReviewData {
  courses: ReviewItem[];
  units: ReviewItem[];
  lessons: ReviewItem[];
  vocabulary: ReviewItem[];
  exercises: ReviewItem[];
}

const sourceConfig: Record<ContentSource, { label: string; icon: typeof User; color: string; bg: string }> = {
  human: { label: 'Human', icon: User, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  ai: { label: 'AI', icon: Bot, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  linguist: { label: 'Linguist', icon: GraduationCap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const tabKeys = ['courses', 'units', 'lessons', 'vocabulary', 'exercises'] as const;
const tabLabels: Record<string, string> = {
  courses: 'Courses',
  units: 'Units',
  lessons: 'Lessons',
  vocabulary: 'Vocabulary',
  exercises: 'Exercises',
};

export default function ReviewView() {
  const navigate = useNavigationStore((s) => s.navigate);
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/review');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (type: string, id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, action }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // Silent fail
    }
  };

  const totalCount = data
    ? data.courses.length + data.units.length + data.lessons.length + data.vocabulary.length + data.exercises.length
    : 0;

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
          <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Content Review</h1>
            {!loading && <p className="text-sm text-muted-foreground">{totalCount} items pending</p>}
          </div>
        </div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-10 rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      )}

      {/* Tabs */}
      {!loading && data && (
        <motion.div variants={fadeUp}>
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/60 p-1 rounded-xl">
              {tabKeys.map((key) => {
                const count = data[key].length;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex-1 min-w-[70px] rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm px-2 py-2"
                  >
                    {tabLabels[key]}
                    {count > 0 && (
                      <span className="ml-1 text-[10px] opacity-60">({count})</span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {tabKeys.map((key) => (
              <TabsContent key={key} value={key} className="mt-4">
                <ReviewTabItems
                  items={data[key]}
                  onApprove={(id) => handleAction(key, id, 'approve')}
                  onReject={(id) => handleAction(key, id, 'reject')}
                />
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      )}

      {/* All reviewed state */}
      {!loading && data && totalCount === 0 && (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex items-center justify-center size-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <Check className="size-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">All caught up!</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            All content has been reviewed!
          </p>
        </motion.div>
      )}
    </motion.main>
  );
}

function ReviewTabItems({
  items,
  onApprove,
  onReject,
}: {
  items: ReviewItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Check className="size-8 text-green-500 mb-2" />
        <p className="text-sm text-muted-foreground">All items in this category are reviewed.</p>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
      {items.map((item) => (
        <ReviewItemCard
          key={item.id}
          item={item}
          onApprove={() => onApprove(item.id)}
          onReject={() => onReject(item.id)}
        />
      ))}
    </motion.div>
  );
}

function ReviewItemCard({
  item,
  onApprove,
  onReject,
}: {
  item: ReviewItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  const cfg = sourceConfig[item.contentSource];
  const SourceIcon = cfg.icon;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div variants={fadeUp}>
      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge
                  variant="secondary"
                  className={`gap-1 px-2 py-0.5 text-[10px] font-semibold border-0 ${cfg.bg} ${cfg.color}`}
                >
                  <SourceIcon className="size-3" />
                  {cfg.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{formatDate(item.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={onApprove}
                className="h-8 px-3 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer"
              >
                <Check className="size-3.5 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onReject}
                className="h-8 px-3 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <X className="size-3.5 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
