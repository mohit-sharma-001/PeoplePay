import React from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

export interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  theme = 'light',
  className,
}) => {
  const { brandPreset } = useTheme();

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 52,
  };

  const px = iconSizes[size];

  const primaryStroke = brandPreset === 'classic-blue' ? '#2563EB' : '#714B67';
  const secondaryStroke = brandPreset === 'classic-blue' ? '#1D4ED8' : '#5B3D54';

  return (
    <div className={cn('inline-flex items-center gap-3 select-none', className)}>
      {/* Abstract 360 Workforce Symbol */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        {/* Outer 360 Degree Arch Gradient Loop */}
        <path
          d="M24 6C14.0589 6 6 14.0589 6 24C6 33.9411 14.0589 42 24 42C31.5434 42 37.9943 37.3364 40.6481 30.75"
          stroke={primaryStroke}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Inner Counter Arc */}
        <path
          d="M34 24C34 29.5228 29.5228 34 24 34C18.4772 34 14 29.5228 14 24C14 18.4772 18.4772 14 24 14"
          stroke={secondaryStroke}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="1 3"
        />
        {/* Human Node Head (Accent Orange) */}
        <circle cx="24" cy="18" r="4" fill="#F59E0B" />
        {/* Human Shoulder Body Arc (Accent Orange) */}
        <path
          d="M18 28C18 24.6863 20.6863 22 24 22C27.3137 22 30 24.6863 30 28"
          stroke="#F59E0B"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Small 360 Motion Accent Dot */}
        <circle cx="41.5" cy="24" r="2.5" fill="#F59E0B" />
      </svg>

      {/* Wordmark & Descriptor */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center text-lg font-black tracking-tight">
            <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
              PEOPLE
            </span>
            <span style={{ color: primaryStroke }}>PAY</span>
            <span className="text-[#F59E0B]">360</span>
          </div>
          <span
            className={cn(
              'text-[10px] font-semibold tracking-widest uppercase mt-0.5',
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            HR & Payroll
          </span>
        </div>
      )}
    </div>
  );
};
