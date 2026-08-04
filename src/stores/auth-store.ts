import { create } from 'zustand';
import type { UserProfile, GamificationState, Achievement, LevelDef } from '@/types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Gamification
  gamification: GamificationState;
  achievements: Achievement[];
  levels: LevelDef[];

  // Actions
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setGamification: (data: Partial<GamificationState>) => void;
  setAchievements: (achievements: Achievement[]) => void;
  setLevels: (levels: LevelDef[]) => void;
  logout: () => void;
  addXp: (amount: number) => void;
  spendHearts: (amount: number) => void;
  spendCoins: (amount: number) => void;
  addCoins: (amount: number) => void;
}

const defaultGamification: GamificationState = {
  xp: 0,
  level: 1,
  hearts: 5,
  maxHearts: 5,
  coins: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveAt: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  gamification: defaultGamification,
  achievements: [],
  levels: [],

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setGamification: (data) => set((state) => ({
    gamification: { ...state.gamification, ...data },
  })),

  setAchievements: (achievements) => set({ achievements }),

  setLevels: (levels) => set({ levels }),

  logout: () => set({
    user: null,
    isAuthenticated: false,
    gamification: defaultGamification,
  }),

  addXp: (amount) => {
    const { gamification, levels } = get();
    const newXp = gamification.xp + amount;
    let newLevel = gamification.level;
    // Check level up
    for (const lvl of levels) {
      if (newXp >= lvl.xpRequired && lvl.level > newLevel) {
        newLevel = lvl.level;
      }
    }
    set({
      gamification: { ...gamification, xp: newXp, level: newLevel },
    });
  },

  spendHearts: (amount) => {
    const { gamification } = get();
    set({
      gamification: {
        ...gamification,
        hearts: Math.max(0, gamification.hearts - amount),
      },
    });
  },

  spendCoins: (amount) => {
    const { gamification } = get();
    set({
      gamification: {
        ...gamification,
        coins: Math.max(0, gamification.coins - amount),
      },
    });
  },

  addCoins: (amount) => {
    const { gamification } = get();
    set({
      gamification: { ...gamification, coins: gamification.coins + amount },
    });
  },
}));
