import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

export const COLORS = {
  purple: '#8b5cf6',
  violet: '#a78bfa',
  green: '#22c55e',
  amber: '#eab308',
  red: '#ef4444',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  pink: '#d946ef',
  slate: '#475569',
};

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function Card({ children, className = '', title, action, noPadding = false }) {
  return (
    <section
      className={cn(
        'rounded-xl border border-[#263348] bg-[#111827] overflow-hidden shadow-lg',
        'transition-all duration-300 ease-out hover:border-violet-500/50 hover:shadow-violet-500/10',
        noPadding ? '' : 'p-5',
        className
      )}
    >
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[13px] font-semibold text-slate-100 tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-violet-500 rounded-full inline-block"></span>
            {title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function KpiCard({ icon: Icon, title, value, trend, trendType = 'up', tone = 'purple', sub }) {
  const toneMap = {
    purple: 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20',
    green: 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20',
    amber: 'bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20',
  };
  return (
    <div className="group rounded-xl border border-[#263348] bg-[#111827] p-4 flex flex-col justify-between transition-all duration-300 ease-out hover:border-violet-500/50 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110', toneMap[tone])}>
          {Icon && <Icon className="h-5 w-5" strokeWidth={2} />}
        </div>
        {sub && <span className="text-[10px] text-slate-400 font-medium">{sub}</span>}
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-medium text-slate-400 mb-1">{title}</p>
        <div className="text-[22px] font-bold tracking-tight text-white transition-colors group-hover:text-violet-300">{value}</div>
        {trend && (
          <div className={cn('mt-2 flex items-center gap-1.5 text-[10px] font-medium', trendType === 'up' ? 'text-green-400' : trendType === 'down' ? 'text-red-400' : 'text-yellow-400')}>
            {trendType === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : trendType === 'down' ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

export function MiniBar({ value, max = 100, tone = 'purple', label, right, height = 'h-1.5' }) {
  const toneClass = { purple: 'bg-violet-500', green: 'bg-[#22c55e]', amber: 'bg-[#eab308]', red: 'bg-[#ef4444]', blue: 'bg-[#3b82f6]' }[tone] || 'bg-violet-500';
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="w-full group/bar">
      {(label || right) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
          <span className="truncate text-slate-300 group-hover/bar:text-white transition-colors">{label}</span>
          <span className="shrink-0 text-slate-400 font-semibold">{right}</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-[#1e293b]", height)}>
        <div className={cn('h-full rounded-full transition-all duration-700 ease-out group-hover/bar:brightness-125', toneClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function LineChart({ series = [], labels = [], height = 220, min = 0, max = 100, grid = true, ySuffix = '' }) {
  const width = 720;
  const pad = { left: 45, right: 15, top: 15, bottom: 30 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const safeMax = max > min ? max : min + 10;
  const x = (index, count) => pad.left + (count <= 1 ? 0 : (index / (count - 1)) * innerW);
  const y = (value) => pad.top + (1 - (value - min) / (safeMax - min)) * innerH;

  const buildPath = (values) => values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i, values.length).toFixed(2)} ${y(v).toFixed(2)}`).join(' ');

  const buildAreaPath = (values) => {
    if (!values || values.length === 0) return '';
    const linePath = buildPath(values);
    const lastX = x(values.length - 1, values.length);
    const firstX = x(0, values.length);
    const bottomY = pad.top + innerH;
    return `${linePath} L ${lastX.toFixed(2)} ${bottomY} L ${firstX.toFixed(2)} ${bottomY} Z`;
  };

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="w-full relative group/chart">
      {hoveredPoint && (
        <div className="absolute top-0 right-2 bg-[#1e293b] border border-violet-500/50 px-2.5 py-1 rounded text-[10px] text-white shadow-xl z-20 flex items-center gap-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full" style={{ background: hoveredPoint.color }}></span>
          <span>{hoveredPoint.label}: <strong className="text-violet-300">{hoveredPoint.value}{ySuffix}</strong></span>
        </div>
      )}

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto transition-transform duration-500 group-hover/chart:scale-[1.01]" preserveAspectRatio="none">
          <defs>
            {series.map((s, idx) => (
              <linearGradient key={idx} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {grid && [0, 0.25, 0.5, 0.75, 1].map((t) => {
            const yy = pad.top + t * innerH;
            const value = Math.round(safeMax - t * (safeMax - min));
            return (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={yy} y2={yy} stroke="#1e293b" strokeDasharray="4 4" className="transition-colors group-hover/chart:stroke-[#334155]" />
                <text x="2" y={yy + 3} fill="#64748b" fontSize="9">{value}{ySuffix}</text>
              </g>
            );
          })}

          {labels.map((label, i) => (
            <text key={i} x={x(i, labels.length)} y={height - 8} textAnchor="middle" fill="#64748b" fontSize="9">
              {label}
            </text>
          ))}

          {series.map((s) => (
            <g key={s.key}>
              {s.fillArea && <path d={buildAreaPath(s.values)} fill={`url(#gradient-${s.key})`} className="transition-all duration-500 opacity-80 group-hover/chart:opacity-100" />}
              <path
                d={buildPath(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth={s.dashed ? 2 : 2.5}
                strokeDasharray={s.dashed ? "4 4" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="transition-all duration-500"
              />
              {s.showDots && s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={x(i, s.values.length)}
                  cy={y(v)}
                  r="4"
                  fill="#111827"
                  stroke={s.color}
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredPoint({ label: labels[i] || `Point ${i+1}`, value: v, color: s.color })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer transition-all duration-300 hover:scale-[2] hover:stroke-white"
                />
              ))}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function Donut({ segments = [], centerTop, centerBottom, size = 158 }) {
  const radius = 45; const stroke = 20; const circumference = 2 * Math.PI * radius; let offset = 0;
  return (
    <div className="relative shrink-0 transition-transform duration-500 hover:scale-105 cursor-pointer group/donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90 transition-transform duration-700 group-hover/donut:rotate-45">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        {segments.map((s) => {
          const dash = (s.value / 100) * circumference; const currentOffset = offset; offset += dash;
          return (<circle key={s.label} cx="60" cy="60" r={radius} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-currentOffset} className="transition-all duration-700 group-hover/donut:brightness-125" />);
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[9px] text-slate-400 group-hover/donut:text-violet-400 transition-colors">{centerTop}</span>
        <span className="text-[16px] font-bold text-slate-100">{centerBottom}</span>
      </div>
    </div>
  );
}

export function LegendRow({ label, value, color }) {
  return (
    <div className="flex min-w-[140px] items-center justify-between gap-4 group/legend cursor-pointer p-1 rounded transition-colors hover:bg-[#1e293b]/50">
      <span className="flex items-center gap-2 text-[11px] text-slate-300 group-hover/legend:text-white transition-colors">
        <span className="h-2.5 w-2.5 rounded-[3px] transition-transform group-hover/legend:scale-125" style={{ background: color }} />
        {label}
      </span>
      <span className="text-[11px] font-bold text-slate-200">{value}</span>
    </div>
  );
}

export function ImpactBadge({ value }) {
  const map = { High: 'bg-red-500/10 text-red-400 border-red-500/20', Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  return <span className={cn('inline-flex border rounded-md px-2 py-0.5 text-[9px] font-semibold transition-transform duration-300 hover:scale-110', map[value] || 'bg-slate-800 text-slate-300 border-slate-700')}>{value}</span>;
}

