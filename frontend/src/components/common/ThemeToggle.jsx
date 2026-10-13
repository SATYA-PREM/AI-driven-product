import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-[11px] font-semibold text-slate-400 select-none">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
        className={`relative inline-flex items-center h-6 w-12 rounded-full cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 select-none border shrink-0 ${
          isDark
            ? 'bg-purple-600/90 hover:bg-purple-600 border-purple-500/50 shadow-[0_0_12px_rgba(147,51,234,0.35)]'
            : 'bg-slate-200 hover:bg-slate-300 border-slate-300 shadow-inner'
        }`}
      >
        {/* Track background icons */}
        <span className={`absolute left-1.5 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${isDark ? 'opacity-30 text-white' : 'opacity-100 text-amber-500'}`}>
          <Sun size={11} strokeWidth={2.5} />
        </span>
        <span className={`absolute right-1.5 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${isDark ? 'opacity-100 text-purple-200' : 'opacity-30 text-slate-400'}`}>
          <Moon size={11} strokeWidth={2.5} />
        </span>

        {/* Sliding Thumb Knob */}
        <span
          className={`relative z-10 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
            isDark ? 'translate-x-[26px]' : 'translate-x-[3px]'
          }`}
        >
          {isDark ? (
            <Moon size={10} className="text-purple-700 fill-purple-700" />
          ) : (
            <Sun size={10} className="text-amber-500 fill-amber-500" />
          )}
        </span>
      </button>
    </div>
  );
}
