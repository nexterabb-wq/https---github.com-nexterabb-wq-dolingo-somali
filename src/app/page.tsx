'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

// Views
import LandingView from '@/components/views/LandingView';
import LoginView from '@/components/views/LoginView';
import RegisterView from '@/components/views/RegisterView';
import DashboardView from '@/components/views/DashboardView';
import LearningPathView from '@/components/views/LearningPathView';
import LessonView from '@/components/views/LessonView';
import ProfileView from '@/components/views/ProfileView';
import AchievementsView from '@/components/views/AchievementsView';
import SearchView from '@/components/views/SearchView';
import SettingsView from '@/components/views/SettingsView';
import BookmarksView from '@/components/views/BookmarksView';
import ReviewView from '@/components/views/ReviewView';

// Layout
import { AppHeader } from '@/components/layout/AppHeader';
import { AppBottomNav } from '@/components/layout/AppBottomNav';

// Stores
import { useNavigationStore } from '@/stores/navigation-store';
import { useAuthStore } from '@/stores/auth-store';
import { useLessonStore } from '@/stores/lesson-store';
import type { Course, UserProgressData } from '@/types';

const pageFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

function AppContent() {
  const currentView = useNavigationStore((s) => s.currentView);
  const { setUser, setGamification, setAchievements, setLevels } = useAuthStore();
  const { setCourses, setProgressMap } = useLessonStore();

  // Check session on mount
  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok && !cancelled) {
          const session = await res.json();
          if (session?.user) {
            setUser({
              id: session.user.id || '',
              email: session.user.email || '',
              name: session.user.name || null,
              image: session.user.image || null,
              role: session.user.role || 'learner',
            });

            // Load gamification
            try {
              const gamRes = await fetch('/api/gamification');
              if (gamRes.ok && !cancelled) {
                const gamData = await gamRes.json();
                if (gamData.gamification) setGamification(gamData.gamification);
                if (gamData.achievements) setAchievements(gamData.achievements);
                if (gamData.levels) setLevels(gamData.levels);
              }
            } catch {
              // Silent fail
            }

            // Load progress
            try {
              const progRes = await fetch('/api/progress');
              if (progRes.ok && !cancelled) {
                const progData: UserProgressData[] = await progRes.json();
                const map: Record<string, UserProgressData> = {};
                for (const p of progData) {
                  map[p.lessonId] = p;
                }
                setProgressMap(map);
              }
            } catch {
              // Silent fail
            }

            // Load courses
            try {
              const courseRes = await fetch('/api/courses');
              if (courseRes.ok && !cancelled) {
                const courseData: Course[] = await courseRes.json();
                setCourses(courseData);
              }
            } catch {
              // Silent fail
            }
          }
        }
      } catch {
        // Not authenticated or error
      }
    }

    initSession();
    return () => { cancelled = true; };
  }, []);

  const isAuthView = currentView === 'landing' || currentView === 'login' || currentView === 'register';

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <LandingView />;
      case 'login': return <LoginView />;
      case 'register': return <RegisterView />;
      case 'dashboard': return <DashboardView />;
      case 'learning-path': return <LearningPathView />;
      case 'lesson': return <LessonView />;
      case 'profile': return <ProfileView />;
      case 'achievements': return <AchievementsView />;
      case 'search': return <SearchView />;
      case 'settings': return <SettingsView />;
      case 'bookmarks': return <BookmarksView />;
      case 'review': return <ReviewView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {isAuthView ? (
        <AnimatePresence mode="wait">
          <motion.div key={currentView} {...pageFade} className="flex-1">
            {renderView()}
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          <AppHeader />
          <main className="flex-1 pb-20 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div key={currentView} {...pageFade}>
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
          <AppBottomNav />
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </ThemeProvider>
  );
}
