import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';

export const OverviewCreativeBackground: React.FC = () => {
  const { themeMode } = useTheme();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Applies to BOTH 'light' and 'dark' themes for Executive Overview
  const isLight = themeMode === 'light';
  const isDark = themeMode === 'dark';

  if (!isLight && !isDark) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Ambient Background Gradient Glow Orbs */}
      <div
        className={cn(
          'absolute -top-24 -right-24 w-[500px] h-[500px] sm:w-[650px] sm:h-[650px] rounded-full blur-3xl transition-opacity duration-700',
          isLight ? 'opacity-35' : 'opacity-25'
        )}
        style={{
          background: isLight
            ? `radial-gradient(circle at center, rgba(21, 188, 223, 0.35) 0%, rgba(113, 75, 103, 0.25) 45%, rgba(245, 158, 11, 0.15) 70%, transparent 100%)`
            : `radial-gradient(circle at center, rgba(154, 111, 140, 0.40) 0%, rgba(56, 189, 248, 0.25) 45%, rgba(245, 158, 11, 0.20) 70%, transparent 100%)`,
        }}
      />

      <div
        className={cn(
          'absolute top-1/3 -left-32 w-[400px] h-[400px] rounded-full blur-3xl transition-opacity duration-700',
          isLight ? 'opacity-25' : 'opacity-15'
        )}
        style={{
          background: isLight
            ? `radial-gradient(circle at center, rgba(113, 75, 103, 0.30) 0%, rgba(21, 188, 223, 0.15) 60%, transparent 100%)`
            : `radial-gradient(circle at center, rgba(56, 189, 248, 0.30) 0%, rgba(154, 111, 140, 0.20) 60%, transparent 100%)`,
        }}
      />

      {/* 2. Abstract Flowing Vector Mesh & Waves SVG */}
      <svg
        className="absolute top-0 right-0 w-full h-[600px] opacity-40 mix-blend-normal"
        viewBox="0 0 1200 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isLight ? '#714B67' : '#9A6F8C'} stopOpacity="0.6" />
            <stop offset="50%" stopColor={isLight ? '#15BCDF' : '#38BDF8'} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isLight ? '#15BCDF' : '#38BDF8'} stopOpacity="0.5" />
            <stop offset="100%" stopColor={isLight ? '#714B67' : '#9A6F8C'} stopOpacity="0.1" />
          </linearGradient>

          <pattern id="grid-dots" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill={isLight ? '#714B67' : '#9A6F8C'} fillOpacity={isLight ? '0.12' : '0.18'} />
          </pattern>
        </defs>

        {/* Top-Right Dots Grid Texture */}
        <rect x="600" y="0" width="600" height="400" fill="url(#grid-dots)" />

        {/* Animated Flowing Curve 1 */}
        <motion.path
          d="M 400 0 C 650 150, 850 50, 1200 280 L 1200 0 Z"
          fill="url(#gradient1)"
          animate={prefersReducedMotion ? {} : { d: [
            "M 400 0 C 650 150, 850 50, 1200 280 L 1200 0 Z",
            "M 350 0 C 700 100, 800 120, 1200 220 L 1200 0 Z",
            "M 400 0 C 650 150, 850 50, 1200 280 L 1200 0 Z"
          ]}}
          transition={prefersReducedMotion ? {} : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Animated Flowing Curve 2 */}
        <motion.path
          d="M 500 0 C 750 220, 950 120, 1200 380 L 1200 0 Z"
          fill="url(#gradient2)"
          animate={prefersReducedMotion ? {} : { d: [
            "M 500 0 C 750 220, 950 120, 1200 380 L 1200 0 Z",
            "M 550 0 C 700 180, 900 160, 1200 320 L 1200 0 Z",
            "M 500 0 C 750 220, 950 120, 1200 380 L 1200 0 Z"
          ]}}
          transition={prefersReducedMotion ? {} : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Dynamic Workforce Constellation Nodes & Connecting Beams */}
        <g opacity={isLight ? '0.5' : '0.6'}>
          <line x1="750" y1="120" x2="880" y2="240" stroke={isLight ? '#15BCDF' : '#38BDF8'} strokeWidth="1" strokeDasharray="4 4" />
          <line x1="880" y1="240" x2="1040" y2="180" stroke={isLight ? '#714B67' : '#9A6F8C'} strokeWidth="1" strokeDasharray="3 3" />
          <line x1="1040" y1="180" x2="1120" y2="310" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" />

          {/* Pulsing Nodes */}
          <circle cx="750" cy="120" r="5" fill={isLight ? '#714B67' : '#9A6F8C'} />
          <circle cx="750" cy="120" r="10" stroke={isLight ? '#714B67' : '#9A6F8C'} strokeWidth="1" opacity="0.5" />

          <circle cx="880" cy="240" r="6" fill={isLight ? '#15BCDF' : '#38BDF8'} />
          <circle cx="880" cy="240" r="14" stroke={isLight ? '#15BCDF' : '#38BDF8'} strokeWidth="1" opacity="0.4" />

          <circle cx="1040" cy="180" r="5" fill="#F59E0B" />
          <circle cx="1040" cy="180" r="12" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />

          <circle cx="1120" cy="310" r="6" fill={isLight ? '#714B67' : '#9A6F8C'} />
        </g>
      </svg>

      {/* 3. Floating Light Particles/Bokeh Drift */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ y: [0, -30, 0], x: [0, 15, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className={cn('absolute top-20 right-1/4 w-3 h-3 rounded-full', isLight ? 'bg-[#15BCDF]' : 'bg-[#38BDF8]')}
          />
          <motion.div
            animate={{ y: [0, 25, 0], x: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
            className={cn('absolute top-48 right-1/3 w-2.5 h-2.5 rounded-full', isLight ? 'bg-[#714B67]' : 'bg-[#9A6F8C]')}
          />
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, -10, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-36 right-1/6 w-2 h-2 rounded-full bg-[#F59E0B]"
          />
        </div>
      )}
    </div>
  );
};
