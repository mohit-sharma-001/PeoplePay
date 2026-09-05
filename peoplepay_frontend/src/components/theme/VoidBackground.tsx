import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const VESPER_VOID_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4';

export const VoidBackground: React.FC = () => {
  const { themeMode, customBg } = useTheme();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Active ONLY when themeMode === 'custom' && customBg === 'void'
  const isActive = themeMode === 'custom' && customBg === 'void';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Robust autoplay handler for Vesper.ai void video
  useEffect(() => {
    if (!isActive || prefersReducedMotion) return;

    const attemptPlay = () => {
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {
          // Play prevented by browser policy; retry will occur
        });
      }
    };

    attemptPlay();

    const intervalId = window.setInterval(() => {
      if (videoRef.current?.paused) {
        attemptPlay();
      }
    }, 1000);

    const handleUserInteraction = () => {
      attemptPlay();
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [isActive, prefersReducedMotion]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black select-none"
        aria-hidden="true"
      >
        {/* Layer 1: Vesper.ai Dark Cinematic Operational-AI Video */}
        {!prefersReducedMotion ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          >
            <source src={VESPER_VOID_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          <div className="absolute inset-0 w-full h-full bg-[#000000]" />
        )}

        {/* Layer 2: Atmospheric Dark Readability Scrim Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.48) 45%, rgba(0,0,0,0.58) 100%),
              linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 65%, rgba(0,0,0,0.82) 100%)
            `,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

