'use client';

import { motion } from 'framer-motion';
import { Settings, ArrowLeft, Sun, Moon, Volume2, Bell, Globe, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNavigationStore } from '@/stores/navigation-store';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function SettingsView() {
  const navigate = useNavigationStore((s) => s.navigate);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';
  // next-themes resolves after hydration; use theme directly (defaults to 'light' before mount)

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
          <div className="flex items-center justify-center size-10 rounded-xl bg-muted">
            <Settings className="size-5 text-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={fadeUp}>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Appearance
            </h2>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {mounted && isDark ? (
                  <Moon className="size-5 text-purple-500" />
                ) : (
                  <Sun className="size-5 text-amber-500" />
                )}
                <div>
                  <Label htmlFor="theme-toggle" className="text-sm font-medium text-foreground cursor-pointer">
                    Dark Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isDark ? 'Dark theme is active' : 'Light theme is active'}
                  </p>
                </div>
              </div>
              <Switch
                id="theme-toggle"
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                aria-label="Toggle dark mode"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sound Effects */}
      <motion.div variants={fadeUp}>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Sound Effects
            </h2>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Volume2 className="size-5 text-green-500" />
                <div>
                  <Label htmlFor="sound-toggle" className="text-sm font-medium text-foreground cursor-pointer">
                    Sound Effects
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Play sounds for correct and wrong answers
                  </p>
                </div>
              </div>
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                aria-label="Toggle sound effects"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={fadeUp}>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Notifications
            </h2>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-orange-500" />
                <div>
                  <Label htmlFor="notif-toggle" className="text-sm font-medium text-foreground cursor-pointer">
                    Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Daily reminders to practice
                  </p>
                </div>
              </div>
              <Switch
                id="notif-toggle"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                aria-label="Toggle notifications"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Language */}
      <motion.div variants={fadeUp}>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Language
            </h2>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Globe className="size-5 text-teal-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">Learning Path</p>
                  <p className="text-xs text-muted-foreground">
                    Somali → English
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                Active
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div variants={fadeUp}>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4 space-y-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              About
            </h2>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Info className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">App Version</p>
                  <p className="text-xs text-muted-foreground">v1.0.0</p>
                </div>
              </div>
            </div>
            <Separator className="my-1" />
            <div className="py-2">
              <p className="text-xs text-muted-foreground text-center">
                Made for Somali speakers worldwide
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  );
}
