import { create } from 'zustand';
import type { TranslationResult } from '@/utils/constants';
import { MAX_HISTORY_SIZE, INTERSTITIAL_INTERVAL } from '@/utils/constants';

interface TranslationState {
  currentTranslation: TranslationResult | null;
  isLoading: boolean;
  error: string | null;
  translationCount: number;
  history: TranslationResult[];
  shouldShowInterstitial: boolean;

  setTranslation: (translation: TranslationResult) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  incrementCount: () => void;
  addToHistory: (translation: TranslationResult) => void;
  clearHistory: () => void;
  clearInterstitialFlag: () => void;
}

export const useTranslationStore = create<TranslationState>()((set, get) => ({
  currentTranslation: null,
  isLoading: false,
  error: null,
  translationCount: 0,
  history: [],
  shouldShowInterstitial: false,

  setTranslation: (translation: TranslationResult) => {
    set({ currentTranslation: translation, error: null });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  incrementCount: () => {
    const newCount = get().translationCount + 1;
    const shouldShow = newCount % INTERSTITIAL_INTERVAL === 0;
    set({
      translationCount: newCount,
      shouldShowInterstitial: shouldShow,
    });
  },

  addToHistory: (translation: TranslationResult) => {
    const current = get().history;
    const updated = [translation, ...current].slice(0, MAX_HISTORY_SIZE);
    set({ history: updated });
  },

  clearHistory: () => {
    set({ history: [] });
  },

  clearInterstitialFlag: () => {
    set({ shouldShowInterstitial: false });
  },
}));
