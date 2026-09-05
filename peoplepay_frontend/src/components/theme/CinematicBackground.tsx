import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const CINEMATIC_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4';

export const CinematicBackground: React.FC = () => {
  const { themeMode, customBg } = useTheme();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const isActive = themeMode === 'custom' && customBg === 'cinematic';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#050406] select-none"
        aria-hidden="true"
      >
        {/* Layer 1: Reference Cinematic MP4 Video */}
        {!prefersReducedMotion ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-center transform scale-[1.01]"
          >
            <source src={CINEMATIC_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          <div className="w-full h-full bg-[#050406] flex items-center justify-center">
            <div className="w-48 h-96 bg-gradient-to-t from-transparent via-white/10 to-transparent blur-xl opacity-40" />
          </div>
        )}

        {/* Layer 2: Readability Scrim Overlay (Horizontal & Vertical Readability Gradients) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.40) 38%, rgba(0,0,0,0.16) 68%, rgba(0,0,0,0.35) 100%),
              linear-gradient(to bottom, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.40) 78%, rgba(0,0,0,0.90) 100%)
            `,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};
