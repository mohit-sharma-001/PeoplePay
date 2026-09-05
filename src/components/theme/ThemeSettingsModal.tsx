import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sparkles, X, CheckCircle2, Clapperboard, CircleDot } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeMode, CustomBackground } from '../../types/theme';
import { cn } from '../../lib/utils';
import { IconButton } from '../ui/IconButton';

export const ThemeSettingsModal: React.FC = () => {
  const { themeMode, customBg, setThemeMode, setCustomBg, isSettingsOpen, closeSettings } = useTheme();

  if (!isSettingsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={closeSettings}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden z-10 p-6 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Appearance & Theme</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Customize global visual presentation and workspace background.
              </p>
            </div>
            <IconButton icon={<X className="w-4 h-4" />} label="Close settings" onClick={closeSettings} />
          </div>

          {/* Section 1: Main Appearance Mode Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Appearance Mode
            </label>

            <div className="grid grid-cols-3 gap-3">
              {/* Light Option */}
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={cn(
                  'p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all cursor-pointer select-none',
                  themeMode === 'light'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20 shadow-xs'
                    : 'border-[var(--border-color)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]'
                )}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span>Light</span>
              </button>

              {/* Dark Option */}
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={cn(
                  'p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all cursor-pointer select-none',
                  themeMode === 'dark'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20 shadow-xs'
                    : 'border-[var(--border-color)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]'
                )}
              >
                <Moon className="w-5 h-5 text-purple-400" />
                <span>Dark</span>
              </button>

              {/* Custom Option */}
              <button
                type="button"
                onClick={() => setThemeMode('custom')}
                className={cn(
                  'p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all cursor-pointer select-none',
                  themeMode === 'custom'
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20 shadow-xs'
                    : 'border-[var(--border-color)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]'
                )}
              >
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* Section 2: Custom Background Style Selection (Appears ONLY when Custom is selected) */}
          <AnimatePresence>
            {themeMode === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 pt-4 border-t border-[var(--border-color)]"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Custom Background Style
                  </label>
                  <span className="text-[10px] text-[#F59E0B] font-semibold bg-[#FFF4DE] px-2 py-0.5 rounded-full">
                    Atmosphere Only
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Cinematic Option */}
                  <button
                    type="button"
                    onClick={() => setCustomBg('cinematic')}
                    className={cn(
                      'p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none relative overflow-hidden group',
                      customBg === 'cinematic'
                        ? 'border-[#B283A4] bg-stone-900 ring-2 ring-[#B283A4]/40 text-white'
                        : 'border-[var(--border-color)] bg-stone-900/60 hover:bg-stone-900 text-stone-300'
                    )}
                  >
                    {/* Visual Preview Graphic */}
                    <div className="h-16 w-full rounded-lg bg-gradient-to-t from-stone-950 via-[#714B67]/30 to-[#F59E0B]/20 relative overflow-hidden mb-3 border border-white/10 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#714B67]/30 blur-sm absolute -top-2" />
                      <Clapperboard className="w-5 h-5 text-amber-400 relative z-10" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Cinematic</span>
                      {customBg === 'cinematic' && <CheckCircle2 className="w-4 h-4 text-[#B283A4]" />}
                    </div>
                  </button>

                  {/* Void Option */}
                  <button
                    type="button"
                    onClick={() => setCustomBg('void')}
                    className={cn(
                      'p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none relative overflow-hidden group',
                      customBg === 'void'
                        ? 'border-[#9A6F8C] bg-black ring-2 ring-[#9A6F8C]/40 text-white'
                        : 'border-[var(--border-color)] bg-black/70 hover:bg-black text-stone-300'
                    )}
                  >
                    {/* Visual Preview Graphic */}
                    <div className="h-16 w-full rounded-lg bg-black border border-white/10 relative overflow-hidden mb-3 flex items-center justify-center">
                      <CircleDot className="w-5 h-5 text-stone-500" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Void</span>
                      {customBg === 'void' && <CheckCircle2 className="w-4 h-4 text-[#9A6F8C]" />}
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Close Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={closeSettings}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
