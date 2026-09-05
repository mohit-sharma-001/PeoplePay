import React, { useState, useEffect, useRef } from 'react';

const BIRDS_SCENERY_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260901_122529_931c22c8-8d2d-47c0-ad51-b97f56a91e42.mp4';

const BIRDS_SCENERY_POSTER_URL =
  'https://d2ol7oe51mr4n.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4f690bd1-881a-4192-82f2-d714d34c8fb9.png';

export const LoginLandscapeBackground: React.FC = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Autoplay robustness handler for the login birds/scenery background
  useEffect(() => {
    if (prefersReducedMotion) return;

    const attemptPlay = () => {
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {
          // Autoplay prevented by browser policy; will retry
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
  }, [prefersReducedMotion]);

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 bg-[#EAE3DE]"
      aria-hidden="true"
    >
      {/* Layer 0: Dedicated Birds + Scenery Video Background / Poster Fallback */}
      {!prefersReducedMotion ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={BIRDS_SCENERY_POSTER_URL}
          className="w-full h-full object-cover object-center transform scale-[1.01]"
        >
          <source src={BIRDS_SCENERY_VIDEO_URL} type="video/mp4" />
          <img
            src={BIRDS_SCENERY_POSTER_URL}
            alt="Birds and Scenery Landscape"
            className="w-full h-full object-cover object-center"
          />
        </video>
      ) : (
        <img
          src={BIRDS_SCENERY_POSTER_URL}
          alt="Birds and Scenery Landscape"
          className="w-full h-full object-cover object-center"
        />
      )}

      {/* Layer 1: Subtle readability scrim overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom, rgba(234, 227, 222, 0.20) 0%, rgba(234, 227, 222, 0.05) 50%, rgba(234, 227, 222, 0.30) 100%),
            radial-gradient(ellipse at center, rgba(23, 90, 103, 0.03) 0%, rgba(23, 90, 103, 0.10) 100%)
          `,
        }}
      />
    </div>
  );
};
