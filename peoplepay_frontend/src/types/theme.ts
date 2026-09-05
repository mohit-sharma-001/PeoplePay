export type ThemeMode = 'light' | 'dark' | 'custom';
export type CustomBackground = 'cinematic' | 'void';

export interface ThemeContextType {
  themeMode: ThemeMode;
  customBg: CustomBackground;
  setThemeMode: (mode: ThemeMode) => void;
  setCustomBg: (bg: CustomBackground) => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}
