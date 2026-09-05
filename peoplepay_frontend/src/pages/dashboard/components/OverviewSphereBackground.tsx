import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';

export const OverviewSphereBackground: React.FC = () => {
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

  // Strictly render ONLY when themeMode === 'light'
  if (themeMode !== 'light') {
    return null;
  }

  return (
    <div
      className="absolute -top-20 -right-24 sm:-top-28 sm:-right-20 lg:-top-32 lg:-right-24 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] lg:w-[640px] lg:h-[640px] pointer-events-none select-none z-0 overflow-visible"
      aria-hidden="true"
    >
      {/* LAYER 1: Ambient Outer Halo Glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-40 transform scale-110"
        style={{
          background: `radial-gradient(circle at center, rgba(21, 188, 223, 0.35) 0%, rgba(113, 75, 103, 0.25) 50%, rgba(245, 158, 11, 0.15) 75%, transparent 100%)`,
        }}
      />

      {/* LAYER 2: Main Dimensional Sphere Body with Floating Animation */}
      <motion.div
        animate={
          prefersReducedMotion
            ? {}
            : {
                y: [0, -14, 0],
                rotate: [0, 360],
              }
        }
        transition={
          prefersReducedMotion
            ? {}
            : {
                y: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 24, repeat: Infinity, ease: 'linear' },
              }
        }
        className="relative w-full h-full rounded-full shadow-2xl overflow-hidden"
        style={{
          background: `radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(247, 246, 248, 0.85) 25%, rgba(21, 188, 223, 0.35) 55%, rgba(113, 75, 103, 0.45) 80%, rgba(43, 48, 51, 0.85) 100%)`,
          boxShadow: `inset -20px -20px 50px rgba(43, 48, 51, 0.4), inset 15px 15px 30px rgba(255, 255, 255, 0.8), 0 25px 60px rgba(21, 188, 223, 0.20)`,
        }}
      >
        {/* LAYER 3: 3D Longitude & Latitude Wireframe Rings */}
        <svg
          className="absolute inset-0 w-full h-full opacity-45 mix-blend-overlay"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Latitude Concentric Ellipses */}
          <ellipse cx="200" cy="200" rx="190" ry="60" stroke="#15BCDF" strokeWidth="1.5" strokeDasharray="4 4" />
          <ellipse cx="200" cy="200" rx="190" ry="110" stroke="#714B67" strokeWidth="1.5" />
          <ellipse cx="200" cy="200" rx="190" ry="160" stroke="#15BCDF" strokeWidth="1" strokeDasharray="6 3" />
          <ellipse cx="200" cy="200" rx="190" ry="190" stroke="#2B3033" strokeWidth="1" opacity="0.6" />

          {/* Longitude Vertical Ellipses */}
          <ellipse cx="200" cy="200" rx="60" ry="190" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />
          <ellipse cx="200" cy="200" rx="110" ry="190" stroke="#714B67" strokeWidth="1.5" />
          <ellipse cx="200" cy="200" rx="160" ry="190" stroke="#15BCDF" strokeWidth="1" />

          {/* Diagonal Orbital Rings */}
          <g transform="rotate(35 200 200)">
            <ellipse cx="200" cy="200" rx="180" ry="70" stroke="#15BCDF" strokeWidth="2" strokeDasharray="8 4" />
          </g>
          <g transform="rotate(-45 200 200)">
            <ellipse cx="200" cy="200" rx="185" ry="85" stroke="#714B67" strokeWidth="1.5" />
          </g>
        </svg>

        {/* LAYER 4: Inner Dimensional Specular Highlight */}
        <div
          className="absolute top-[12%] left-[18%] w-[40%] h-[25%] rounded-full blur-md opacity-80"
          style={{
            background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 75%)`,
          }}
        />

        {/* LAYER 5: Secondary Cyan Rim Reflection */}
        <div
          className="absolute bottom-[5%] right-[10%] w-[50%] h-[40%] rounded-full blur-xl opacity-50"
          style={{
            background: `radial-gradient(ellipse at center, rgba(21, 188, 223, 0.6) 0%, transparent 80%)`,
          }}
        />
      </motion.div>
    </div>
  );
};
