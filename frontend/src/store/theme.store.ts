import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'midnight' | 'emerald-light' | 'nordic-frost' | 'golden-obsidian';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  tagline: string;
  fontName: string;
  type: 'dark' | 'light';
  preview: {
    bg: string;
    card: string;
    primary: string;
    accent: string;
  };
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'midnight',
    name: 'Midnight Indigo',
    tagline: 'Cyber Dark Mode',
    fontName: 'Inter & Outfit',
    type: 'dark',
    preview: {
      bg: '#0f0f13',
      card: '#1e1e2a',
      primary: '#6366f1',
      accent: '#14b8a6',
    },
  },
  {
    id: 'emerald-light',
    name: 'Clinical Pearl',
    tagline: 'High-Contrast Light Mode',
    fontName: 'Plus Jakarta Sans',
    type: 'light',
    preview: {
      bg: '#f1f5f9',
      card: '#ffffff',
      primary: '#0284c7',
      accent: '#059669',
    },
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    tagline: 'Oceanic Dark Cyan',
    fontName: 'Space Grotesk',
    type: 'dark',
    preview: {
      bg: '#081721',
      card: '#112532',
      primary: '#06b6d4',
      accent: '#f43f5e',
    },
  },
  {
    id: 'golden-obsidian',
    name: 'Golden Obsidian',
    tagline: 'Warm Amber & Gold',
    fontName: 'Manrope',
    type: 'dark',
    preview: {
      bg: '#12100e',
      card: '#241f1b',
      primary: '#f59e0b',
      accent: '#f97316',
    },
  },
];

interface ThemeState {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  initTheme: () => void;
}

export const applyThemeToDOM = (theme: ThemeId) => {
  document.documentElement.setAttribute('data-theme', theme);
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'midnight',
      setTheme: (theme) => {
        applyThemeToDOM(theme);
        set({ currentTheme: theme });
      },
      initTheme: () => {
        applyThemeToDOM(get().currentTheme || 'midnight');
      },
    }),
    {
      name: 'onemed-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.currentTheme) {
          applyThemeToDOM(state.currentTheme);
        }
      },
    }
  )
);
