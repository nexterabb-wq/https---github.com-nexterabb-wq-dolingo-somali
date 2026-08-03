'use client';

import { Flame, Heart, Star, Coins, Search, Settings, Menu, LayoutDashboard, BookOpen, User, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useNavigationStore } from '@/stores/navigation-store';
import { useAuthStore } from '@/stores/auth-store';
import type { AppView } from '@/types';
import { cn } from '@/lib/utils';

const mobileNavItems: { view: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { view: 'learning-path', label: 'Learn', icon: BookOpen },
  { view: 'search', label: 'Search', icon: Search },
  { view: 'profile', label: 'Profile', icon: User },
  { view: 'achievements', label: 'Achievements', icon: Trophy },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export function AppHeader() {
  const navigate = useNavigationStore((s) => s.navigate);
  const currentView = useNavigationStore((s) => s.currentView);
  const { isAuthenticated, gamification } = useAuthStore();

  if (!isAuthenticated) return null;

  const { currentStreak, hearts, xp, coins } = gamification;

  const gamItems = [
    { icon: Flame, value: currentStreak, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40' },
    { icon: Heart, value: hearts, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40' },
    { icon: Star, value: xp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { icon: Coins, value: coins, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/40' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-3 sm:px-4 lg:px-6 max-w-5xl mx-auto">
        {/* Logo */}
        <button
          onClick={() => navigate('dashboard')}
          className="flex items-center gap-2 shrink-0 min-h-[44px] min-w-[44px] justify-center"
          aria-label="Go to dashboard"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold text-xs">
            DS
          </div>
          <span className="font-bold text-foreground text-sm sm:text-base hidden sm:inline">
            Duolingo Somali
          </span>
        </button>

        {/* Center: Gamification badges - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          {gamItems.map((item) => (
            <Badge
              key={item.color}
              variant="secondary"
              className={cn(
                'gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-full border-0',
                item.bg,
                item.color
              )}
            >
              <item.icon className="size-3.5" />
              <span>{item.value}</span>
            </Badge>
          ))}
        </div>

        {/* Center: Compact gam badges - Mobile */}
        <div className="flex md:hidden items-center gap-1.5">
          {gamItems.slice(0, 3).map((item) => (
            <div
              key={item.color}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
                item.bg,
                item.color
              )}
            >
              <item.icon className="size-3" />
              <span>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Right: Action buttons - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('search')}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Search"
          >
            <Search className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('settings')}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Settings"
          >
            <Settings className="size-5" />
          </Button>
        </div>

        {/* Right: Hamburger - Mobile */}
        <div className="flex md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="p-4 pb-0">
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold text-xs">
                    DS
                  </div>
                  Duolingo Somali
                </SheetTitle>
              </SheetHeader>
              <Separator className="mt-2" />
              <nav className="flex flex-col gap-1 p-3">
                {mobileNavItems.map((item) => (
                  <button
                    key={item.view}
                    onClick={() => navigate(item.view)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]',
                      currentView === item.view
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    <item.icon className="size-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
              <Separator />
              <div className="p-4 flex items-center gap-2">
                <Coins className="size-4 text-yellow-500" />
                <span className="text-sm font-semibold text-foreground">{coins} coins</span>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
