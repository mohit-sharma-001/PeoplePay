import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandPreset, ThemeMode, CustomBackground, ThemeContextType } from '../types/theme';

const STORAGE_KEY_BRAND = 'peoplepay360-brand-preset';
const STORAGE_KEY_THEME = 'peoplepay360-theme';
const STORAGE_KEY_CUSTOM_BG = 'peoplepay360-custom-background';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandPreset, setBrandPresetState] = useState<BrandPreset>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BRAND);
    if (saved === 'odoo-purple' || saved === 'classic-blue') {
      return saved;
    }
    return 'odoo-purple';
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'light' || saved === 'dark' || saved === 'custom') {
      return saved;
    }
    return 'light';
  });

  const [customBg, setCustomBgState] = useState<CustomBackground>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_BG);
    if (saved === 'cinematic' || saved === 'void') {
      return saved;
    }
    return 'cinematic';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Apply dataset attributes to root element
    document.documentElement.setAttribute('data-brand', brandPreset);
    document.documentElement.setAttribute('data-theme', themeMode);
    if (themeMode === 'custom') {
      document.documentElement.setAttribute('data-background', customBg);
    } else {
      document.documentElement.removeAttribute('data-background');
    }

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY_BRAND, brandPreset);
    localStorage.setItem(STORAGE_KEY_THEME, themeMode);
    localStorage.setItem(STORAGE_KEY_CUSTOM_BG, customBg);
  }, [brandPreset, themeMode, customBg]);

  const setBrandPreset = (preset: BrandPreset) => {
    setBrandPresetState(preset);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const setCustomBg = (bg: CustomBackground) => {
    setCustomBgState(bg);
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  return (
    <ThemeContext.Provider
      value={{
        brandPreset,
        themeMode,
        customBg,
        setBrandPreset,
        setThemeMode,
        setCustomBg,
        isSettingsOpen,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
