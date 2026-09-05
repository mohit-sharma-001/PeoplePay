export type BrandPreset = 'odoo-purple' | 'classic-blue';
export type ThemeMode = 'light' | 'dark' | 'custom';
export type CustomBackground = 'cinematic' | 'void';

export interface ThemeContextType {
  brandPreset: BrandPreset;
  themeMode: ThemeMode;
  customBg: CustomBackground;
  setBrandPreset: (preset: BrandPreset) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setCustomBg: (bg: CustomBackground) => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}
