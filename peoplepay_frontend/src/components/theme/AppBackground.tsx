import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { LightLandscapeBackground } from './LightLandscapeBackground';
import { CinematicBackground } from './CinematicBackground';
import { VoidBackground } from './VoidBackground';

export const AppBackground: React.FC = () => {
  const { themeMode, customBg } = useTheme();
  const location = useLocation();

  // AppBackground handles authenticated application pages.
  // The Login page (/login) manages its own dedicated Birds + Scenery background.
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <>
      {themeMode === 'light' && <LightLandscapeBackground />}
      {themeMode === 'custom' && customBg === 'cinematic' && <CinematicBackground />}
      {themeMode === 'custom' && customBg === 'void' && <VoidBackground />}
    </>
  );
};
