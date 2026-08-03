import { create } from 'zustand';

interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isLessonPlayerOpen: boolean;
  showConfetti: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info' | 'warning';

  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  setSearchOpen: (open: boolean) => void;
  setLessonPlayerOpen: (open: boolean) => void;
  triggerConfetti: () => void;
  clearConfetti: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isLessonPlayerOpen: false,
  showConfetti: false,
  toastMessage: null,
  toastType: 'info',

  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setLessonPlayerOpen: (open) => set({ isLessonPlayerOpen: open }),
  triggerConfetti: () => set({ showConfetti: true }),
  clearConfetti: () => set({ showConfetti: false }),
  showToast: (message, type = 'info') => set({ toastMessage: message, toastType: type }),
  clearToast: () => set({ toastMessage: null }),
}));
