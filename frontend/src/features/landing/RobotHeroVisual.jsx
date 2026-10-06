import React from 'react';
import { BarChart3, FileText, Zap, CheckCircle2 } from 'lucide-react';

export default function RobotHeroVisual() {
  return (
    <div className="relative w-full max-w-[420px] aspect-square mx-auto flex items-center justify-center select-none">
      {/* Outer Atmospheric Aura */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-cyan-500/20 to-blue-600/30 rounded-full blur-[70px] animate-pulse-slow"></div>
      <div className="absolute w-72 h-72 rounded-full border border-purple-500/20 animate-spin" style={{ animationDuration: '30s' }}></div>
      <div className="absolute w-84 h-84 rounded-full border border-cyan-500/15 border-dashed animate-spin" style={{ animationDuration: '45s', animationDirection: 'reverse' }}></div>

      {/* Floating Action Glass Chips */}
      
      {/* 1. Top-Left: Analyze */}
      <div className="absolute -top-3 left-2 sm:left-4 z-20 group animate-bounce" style={{ animationDuration: '6s' }}>
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0f1426]/85 backdrop-blur-xl border border-purple-500/30 shadow-[0_8px_32px_rgba(147,51,234,0.25)] text-xs font-semibold text-white hover:border-purple-400 hover:scale-105 transition-all">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </div>
          <span>Analyze</span>
        </div>
      </div>

      {/* 2. Top-Right: Summarize */}
      <div className="absolute -top-1 right-2 sm:right-4 z-20 group animate-bounce" style={{ animationDuration: '7s', animationDelay: '1s' }}>
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0f1426]/85 backdrop-blur-xl border border-blue-500/30 shadow-[0_8px_32px_rgba(59,130,246,0.25)] text-xs font-semibold text-white hover:border-blue-400 hover:scale-105 transition-all">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span>Summarize</span>
        </div>
      </div>

      {/* 3. Bottom-Left: Generate Insights */}
      <div className="absolute -bottom-3 -left-2 sm:left-2 z-20 group animate-bounce" style={{ animationDuration: '6.5s', animationDelay: '0.5s' }}>
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0f1426]/85 backdrop-blur-xl border border-purple-500/30 shadow-[0_8px_32px_rgba(168,85,247,0.25)] text-xs font-semibold text-white hover:border-purple-400 hover:scale-105 transition-all">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span>Generate Insights</span>
        </div>
      </div>

      {/* 4. Bottom-Right: Action Items */}
      <div className="absolute -bottom-1 right-0 sm:right-2 z-20 group animate-bounce" style={{ animationDuration: '7.5s', animationDelay: '1.5s' }}>
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0f1426]/85 backdrop-blur-xl border border-cyan-500/30 shadow-[0_8px_32px_rgba(6,182,212,0.25)] text-xs font-semibold text-white hover:border-cyan-400 hover:scale-105 transition-all">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span>Action Items</span>
        </div>
      </div>

      {/* Central High-Tech Cute Robot Model (SVG + Radial Gradients) */}
      <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center transition-transform hover:scale-105 duration-500">
        <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-[0_20px_50px_rgba(147,51,234,0.4)]">
          <defs>
            {/* Robot Head Body Gradient */}
            <linearGradient id="robotBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#e2e8f0" />
              <stop offset="85%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Dark Visor Glass Gradient */}
            <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0b0f19" />
              <stop offset="50%" stopColor="#020617" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Glowing Eye Visor Gradient */}
            <linearGradient id="neonEyeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#4facfe" />
            </linearGradient>

            {/* Neon Blue Glow Filter */}
            <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Purple Glow Filter */}
            <filter id="purpleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Floating Base Shadow */}
          <ellipse cx="150" cy="275" rx="80" ry="14" fill="#581c87" opacity="0.35" filter="url(#purpleGlow)" />

          {/* Robot Torso / Collar */}
          <path
            d="M95 210 C95 210 110 255 150 255 C190 255 205 210 205 210 Z"
            fill="url(#robotBodyGrad)"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          {/* Torso Core Light */}
          <circle cx="150" cy="235" r="7" fill="#00f2fe" filter="url(#cyanGlow)" />

          {/* Robot Head Outer Helmet */}
          <rect
            x="48"
            y="70"
            width="204"
            height="145"
            rx="72"
            fill="url(#robotBodyGrad)"
            stroke="#f8fafc"
            strokeWidth="3"
          />

          {/* Gloss highlight on helmet top */}
          <ellipse cx="150" cy="88" rx="70" ry="12" fill="#ffffff" opacity="0.6" />

          {/* Left Ear Antenna Pod */}
          <rect x="36" y="115" width="16" height="55" rx="8" fill="#3b82f6" filter="url(#cyanGlow)" />
          <circle cx="44" cy="142" r="5" fill="#ffffff" />

          {/* Right Ear Antenna Pod */}
          <rect x="248" y="115" width="16" height="55" rx="8" fill="#a855f7" filter="url(#purpleGlow)" />
          <circle cx="256" cy="142" r="5" fill="#ffffff" />

          {/* Top Antenna Node */}
          <path d="M150 70 L150 42" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="150" cy="38" r="9" fill="#00f2fe" filter="url(#cyanGlow)" />

          {/* Visor Screen Outer Rim */}
          <rect
            x="64"
            y="95"
            width="172"
            height="96"
            rx="48"
            fill="url(#visorGrad)"
            stroke="#1e293b"
            strokeWidth="3"
          />

          {/* Visor Glass Reflection */}
          <path
            d="M74 125 C74 105 90 102 120 102 L180 102 C210 102 226 105 226 125 Z"
            fill="#ffffff"
            opacity="0.08"
          />

          {/* Robot Left Eye (Curved expressive LED) */}
          <path
            d="M95 142 Q115 130 135 142"
            fill="none"
            stroke="url(#neonEyeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#cyanGlow)"
          />

          {/* Robot Right Eye (Curved expressive LED) */}
          <path
            d="M165 142 Q185 130 205 142"
            fill="none"
            stroke="url(#neonEyeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#cyanGlow)"
          />

          {/* Subtle Cute Cheeks */}
          <circle cx="98" cy="165" r="6" fill="#a855f7" opacity="0.5" filter="url(#purpleGlow)" />
          <circle cx="202" cy="165" r="6" fill="#a855f7" opacity="0.5" filter="url(#purpleGlow)" />
        </svg>
      </div>
    </div>
  );
}

