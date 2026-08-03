'use client';

import { LayoutDashboard, BookOpen, Search, User, Trophy } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigation-store';
import { useAuthStore } from '@/stores/auth-store';
import type { AppView } from '@/types';
import { cn } from '@/lib/utils';

const tabs: { view: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { view: 'learning-path', label: 'Learn', icon: BookOpen },
  { view: 'search', label: 'Search', icon: Search },
  { view: 'profile', label: 'Profile', icon: User },
  { view: 'achievements', label: 'Awards', icon: Trophy },
];

export function AppBottomNav() {
  const navigate = useNavigationStore((s) => s.navigate);
  const currentView = useNavigationStore((s) => s.currentView);
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-border/50 md:hidden"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentView === tab.view;
          const Icon = tab.icon;
          return (
            <button
              key={tab.view}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => navigate(tab.view)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors cursor-pointer',
                isActive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('size-5 transition-transform', isActive && 'scale-110')} />
              <span className={cn('text-[10px] leading-tight font-medium', isActive && 'font-bold')}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1.5 size-1 rounded-full bg-green-600 dark:bg-green-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
