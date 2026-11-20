import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { detectDeviceLanguage, isAppLanguage, type AppLanguage } from '@/shared/i18n';
import { createSafeJsonStorage } from '@/shared/store/safeStorage';
import { usePersistHydrated } from '@/shared/store/usePersistHydrated';
import type { ThemeScheme } from '@/shared/theme';

export type SettingsState = {
  theme: ThemeScheme;
  language: AppLanguage;
  setTheme: (theme: ThemeScheme) => void;
  setLanguage: (language: AppLanguage) => void;
};

const isThemeScheme = (value: unknown): value is ThemeScheme =>
  value === 'light' || value === 'dark';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: detectDeviceLanguage(),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'settings',
      version: 1,
      storage: createSafeJsonStorage<Pick<SettingsState, 'theme' | 'language'>>(),
      partialize: ({ theme, language }) => ({ theme, language }),
      // Ignore stored values that are no longer valid (e.g. the removed "system" theme)
      // instead of crashing on them.
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          theme: isThemeScheme(stored.theme) ? stored.theme : current.theme,
          language: isAppLanguage(stored.language) ? stored.language : current.language,
        };
      },
    },
  ),
);

// True once the persisted settings have been read from storage.
export const useSettingsHydrated = (): boolean => usePersistHydrated(useSettingsStore.persist);
