import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const LIGHT_LANDSCAPE_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260823_050407_500d0339-ab28-41c1-9688-132a74a3b5aa.mp4';

const LIGHT_LANDSCAPE_POSTER_URL =
  'https://d2ol7oe51mr4n.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4f690bd1-881a-4192-82f2-d714d34c8fb9.png';

export const LightLandscapeBackground: React.FC = () => {
  const { themeMode } = useTheme();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);

  const isActive = themeMode === 'light';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Autoplay robustness handler
  useEffect(() => {
    if (!isActive || prefersReducedMotion) return;

    const playVideo = (v: HTMLVideoElement | null) => {
      if (v) {
        v.muted = true;
        v.play().catch(() => {
          // Auto-play was prevented; will retry
        });
      }
    };

    const attemptPlay = () => {
      playVideo(desktopVideoRef.current);
      playVideo(mobileVideoRef.current);
    };

    attemptPlay();

    const intervalId = window.setInterval(() => {
      if (desktopVideoRef.current?.paused || mobileVideoRef.current?.paused) {
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
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#F2F1F0] select-none"
        aria-hidden="true"
      >
        {/* Render static poster for reduced motion */}
        {prefersReducedMotion ? (
          <img
            src={LIGHT_LANDSCAPE_POSTER_URL}
            alt="Illustrated Landscape"
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <>
            {/* Desktop Landscape Video (Positioned right:-20%, width:99%, object-contain) */}
            <video
              ref={desktopVideoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={LIGHT_LANDSCAPE_POSTER_URL}
              className="absolute top-0 right-[-20%] w-[99%] h-auto min-h-full object-contain object-right-top pointer-events-none hidden md:block"
            >
              <source src={LIGHT_LANDSCAPE_VIDEO_URL} type="video/mp4" />
            </video>

            {/* Mobile Landscape Video (Positioned left:-12%, width:119%, object-contain) */}
            <video
              ref={mobileVideoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={LIGHT_LANDSCAPE_POSTER_URL}
              className="absolute top-0 left-[-12%] w-[119%] h-auto min-h-full object-contain object-left-top pointer-events-none block md:hidden"
            >
              <source src={LIGHT_LANDSCAPE_VIDEO_URL} type="video/mp4" />
            </video>
          </>
        )}

        {/* Desktop Readability Scrim (Gradient: 90deg, #F2F1F0 0% to 55%, 85% at 78%, transparent at 100%) */}
        <div
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{
            background: `linear-gradient(90deg, #F2F1F0 0%, #F2F1F0 55%, rgba(242, 241, 240, 0.85) 78%, rgba(242, 241, 240, 0) 100%)`,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};
