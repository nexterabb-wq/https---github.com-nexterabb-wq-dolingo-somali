import { create } from 'zustand';
import type { AppView } from '@/types';

interface NavigationState {
  currentView: AppView;
  previousView: AppView | null;
  viewParams: Record<string, string>;
  // Navigation history for back button
  history: AppView[];

  navigate: (view: AppView, params?: Record<string, string>) => void;
  goBack: () => void;
  setParams: (params: Record<string, string>) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentView: 'landing',
  previousView: null,
  viewParams: {},
  history: [],

  navigate: (view, params = {}) => {
    const { currentView, history } = get();
    set({
      currentView: view,
      previousView: currentView,
      viewParams: params,
      history: [...history.slice(-19), currentView], // keep last 20
    });
  },

  goBack: () => {
    const { history } = get();
    if (history.length > 0) {
      const prev = history[history.length - 1];
      set({
        currentView: prev,
        previousView: null,
        history: history.slice(0, -1),
        viewParams: {},
      });
    }
  },

  setParams: (params) => set({ viewParams: params }),
}));
