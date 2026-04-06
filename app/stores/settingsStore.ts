import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TranslationDirection, Dialect } from '@/utils/constants';

interface SettingsState {
  direction: TranslationDirection;
  dialect: Dialect;
  isPremium: boolean;
  toggleDirection: () => void;
  setDialect: (dialect: Dialect) => void;
  setPremium: (isPremium: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      direction: 'UK_TO_US',
      dialect: 'General',
      isPremium: false,

      toggleDirection: () => {
        const current = get().direction;
        set({
          direction: current === 'UK_TO_US' ? 'US_TO_UK' : 'UK_TO_US',
          dialect: 'General',
        });
      },

      setDialect: (dialect: Dialect) => {
        set({ dialect });
      },

      setPremium: (isPremium: boolean) => {
        set({ isPremium });
      },
    }),
    {
      name: 'blimey-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
