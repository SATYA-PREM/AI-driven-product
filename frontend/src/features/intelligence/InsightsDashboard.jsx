import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Filter,
  Grid2X2,
  Lightbulb,
  LineChart as LineChartIcon,
  MessageSquare,
  MoreHorizontal,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

/* =========================================
   CONSTANTS & MOCK DATA STORE
   ========================================= */
const TABS = ['Overview', 'Pain Points', 'Trends', 'Themes', 'Sentiment', 'Segments', 'Comparisons'];

const COLORS = {
  purple: '#8b5cf6',
  violet: '#a78bfa',
  green: '#22c55e', 
  amber: '#eab308', 
  red: '#ef4444',    
  blue: '#3b82f6',
  cyan: '#06b6d4',
  pink: '#d946ef',
};

const PAIN_POINTS_DATA = [
  { id: 1, name: 'Slow Checkout Process', desc: 'Users face delays, timeouts or errors while completing checkout process.', mentions: '1,842', percentage: '14.3%', affected: '1,203', impact: 'High', sentiment: '-0.58 Negative', trend: '↑ 28%', themes: ['Checkout', 'Performance', 'Payments', 'Time Out', 'Errors'] },
  { id: 2, name: 'Payment Failures', desc: 'Payments getting failed or stuck during gateway processing.', mentions: '1,231', percentage: '9.6%', affected: '892', impact: 'High', sentiment: '-0.52 Negative', trend: '↑ 15%', themes: ['Payments', 'Gateway', 'Errors'] },
  { id: 3, name: 'Delayed Order Tracking', desc: 'Tracking info not updated or showing delays in delivery status.', mentions: '978', percentage: '7.6%', affected: '764', impact: 'Medium', sentiment: '-0.36 Negative', trend: '↑ 17%', themes: ['Tracking', 'Shipping', 'Logistics'] },
  { id: 4, name: 'Poor Search Experience', desc: 'Irrelevant product search results or inability to find specific items.', mentions: '764', percentage: '5.9%', affected: '612', impact: 'Medium', sentiment: '-0.27 Neutral', trend: '↓ 5%', themes: ['Search', 'Discovery', 'Catalog'] },
  { id: 5, name: 'Product Quality Issues', desc: 'Complaints about product quality, damage or mismatch with descriptions.', mentions: '642', percentage: '5.0%', affected: '523', impact: 'Medium', sentiment: '-0.31 Neutral', trend: '↑ 8%', themes: ['Quality', 'Returns'] }
];

const THEMES_DATA = [
  { id: 1, name: 'Checkout & Payments', desc: 'Issues related to payment failures, checkout errors, and payment options.', mentions: '2,873', percentage: '22.4%', customers: '2,341', impact: 'High', sentiment: '-0.42 Negative', trend: '↑ 28%', painPoints: ['Payment Failures', 'Slow Checkout', 'UPI Not Working', 'Multiple Payment Options'] },
  { id: 2, name: 'Order Tracking', desc: 'Problems tracking orders, delays in updates and inaccurate status.', mentions: '2,145', percentage: '16.7%', customers: '1,823', impact: 'High', sentiment: '-0.38 Negative', trend: '↑ 17%', painPoints: ['Delayed Order Tracking', 'Live Map Missing'] },
  { id: 3, name: 'App Performance', desc: 'Slow app, crashes, loading issues and general performance.', mentions: '1,876', percentage: '14.6%', customers: '1,542', impact: 'Medium', sentiment: '-0.31 Negative', trend: '↑ 19%', painPoints: ['App Crashes', 'Slow Loading'] },
  { id: 4, name: 'Product Features', desc: 'Requests for new features and improvements across the platform.', mentions: '1,642', percentage: '12.8%', customers: '1,298', impact: 'Medium', sentiment: '0.12 Neutral', trend: '↑ 9%', painPoints: ['Dark Mode', 'Wishlist Sync'] }
];

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function getTabFromHash(hash) {
  const key = (hash || '').replace('#', '');
  const map = { Overview: 'Overview', PainPoints: 'Pain Points', Trends: 'Trends', Themes: 'Themes', Sentiment: 'Sentiment', Segments: 'Segments', Comparisons: 'Comparisons' };
  return map[key] || 'Overview';
}

function useLocalTab() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => getTabFromHash(window.location.hash));
  useEffect(() => { setActiveTab(getTabFromHash(location.hash)); }, [location.hash]);
  const selectTab = (tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${tab.replace(/\s+/g, '')}`);
  };
  return [activeTab, selectTab];
}

/* =========================================
   UI COMPONENTS WITH SMOOTH TRANSITIONS
   ========================================= */
function Card({ children, className = '', title, action, noPadding = false }) {
  return (
    <section className={cn(
      'rounded-xl border border-[#263348] bg-[#111827] overflow-hidden shadow-lg',
      'transition-all duration-300 ease-out hover:border-violet-500 hover:shadow-violet-500/20 hover:-translate-y-1',
      noPadding ? '' : 'p-5', 
      className
    )}>
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

function KpiCard({ icon: Icon, title, value, trend, trendType = 'up', tone = 'purple', sub }) {
  const toneMap = {
    purple: 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20',
    green: 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20',
    amber: 'bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20',
  };
  return (
    <div className="group rounded-xl border border-[#263348] bg-[#111827] p-4 flex flex-col justify-between transition-all duration-300 ease-out hover:border-violet-500/50 hover:-translate-y-1.5 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110', toneMap[tone])}>
          <Icon className="h-5 w-5" strokeWidth={2} />
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

function MiniBar({ value, max = 100, tone = 'purple', label, right, height = 'h-1.5' }) {
  const toneClass = { purple: 'bg-violet-500', green: 'bg-[#22c55e]', amber: 'bg-[#eab308]', red: 'bg-[#ef4444]', blue: 'bg-[#3b82f6]' }[tone] || 'bg-violet-500';
  return (
    <div className="w-full group/bar">
      {(label || right) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
          <span className="truncate text-slate-300 group-hover/bar:text-white transition-colors">{label}</span>
          <span className="shrink-0 text-slate-400 font-semibold">{right}</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-[#1e293b]", height)}>
        <div className={cn('h-full rounded-full transition-all duration-700 ease-out group-hover/bar:brightness-125', toneClass)} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
      </div>
    </div>
  );
}

/* =========================================
   ANIMATED SVG LINE CHART
   ========================================= */
function LineChart({ series = [], labels = [], height = 220, min = 0, max = 100, grid = true, ySuffix = '' }) {
  const width = 720; 
  const pad = { left: 45, right: 15, top: 15, bottom: 30 }; 
  const innerW = width - pad.left - pad.right; 
  const innerH = height - pad.top - pad.bottom;
  
  const x = (index, count) => pad.left + (count <= 1 ? 0 : (index / (count - 1)) * innerW);
  const y = (value) => pad.top + (1 - (value - min) / (max - min)) * innerH;

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
            const value = Math.round(max - t * (max - min));
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
              <path d={buildAreaPath(s.values)} fill={`url(#gradient-${s.key})`} className="transition-all duration-500 opacity-80 group-hover/chart:opacity-100" />
              <path d={buildPath(s.values)} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" className="transition-all duration-500" />
              {s.showDots && s.values.map((v, i) => (
                <circle 
                  key={i} 
                  cx={x(i, s.values.length)} 
                  cy={y(v)} 
                  r="4.5" 
                  fill="#111827" 
                  stroke={s.color} 
                  strokeWidth="2.5" 
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

function Donut({ segments, centerTop, centerBottom, size = 158 }) {
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
        <span className="text-[18px] font-bold text-slate-100">{centerBottom}</span>
      </div>
    </div>
  );
}

function LegendRow({ label, value, color }) {
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

function ImpactBadge({ value }) {
  const map = { High: 'bg-red-500/10 text-red-400 border-red-500/20', Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  return <span className={cn('inline-flex border rounded-md px-2 py-0.5 text-[9px] font-semibold transition-transform duration-300 hover:scale-110', map[value] || 'bg-slate-800 text-slate-300 border-slate-700')}>{value}</span>;
}

/* =========================================
   1. OVERVIEW TAB
   ========================================= */
function OverviewContent({ onToast }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <KpiCard icon={MessageSquare} title="Total Feedback" value="12,842" trend="18.6% vs Jul 1 - Jul 31" tone="purple" />
        <KpiCard icon={CheckCircle2} title="Positive Sentiment" value="35%" trend="4.3% vs Jul 1 - Jul 31" trendType="up" tone="green" />
        <KpiCard icon={MoreHorizontal} title="Neutral Sentiment" value="24%" trend="2.1% vs Jul 1 - Jul 31" trendType="down" tone="amber" />
        <KpiCard icon={TrendingDown} title="Negative Sentiment" value="41%" trend="2.2% vs Jul 1 - Jul 31" trendType="down" tone="red" />
        <KpiCard icon={Users} title="Unique Customers" value="9,812" trend="16.4% vs Jul 1 - Jul 31" tone="blue" />
        <KpiCard icon={FileText} title="Support Tickets" value="2,156" trend="11.7% vs Jul 1 - Jul 31" tone="purple" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1.1fr_1.2fr]">
        <Card title="Feedback Trend Over Time" action={<button className="text-[10px] bg-[#1e293b] hover:bg-violet-600 hover:text-white px-2 py-1 rounded text-slate-300 transition-colors">Daily ▾</button>}>
          <LineChart labels={['Aug 1', 'Aug 6', 'Aug 11', 'Aug 16', 'Aug 21', 'Aug 26', 'Aug 31']} max={4000} height={220} series={[{ key: 'main', color: COLORS.purple, values: [900, 1500, 2600, 1200, 3100, 1900, 3500], showDots: true }]} />
        </Card>
        
        <Card title="Sentiment Distribution">
          <div className="flex h-[220px] flex-row items-center justify-center gap-6 px-4">
            <Donut segments={[{ label: 'Positive', value: 35, color: COLORS.green }, { label: 'Neutral', value: 24, color: COLORS.amber }, { label: 'Negative', value: 41, color: COLORS.red }]} centerTop="Total" centerBottom="12,842" size={135} />
            <div className="flex flex-col justify-center gap-3 text-[10px]">
              <LegendRow label="Positive" value="35%" color={COLORS.green} />
              <LegendRow label="Neutral" value="24%" color={COLORS.amber} />
              <LegendRow label="Negative" value="41%" color={COLORS.red} />
            </div>
          </div>
        </Card>
        
        <Card title="Feedback by Source">
          <div className="flex h-[220px] flex-col justify-center space-y-4">
            <MiniBar label="In-App Feedback" right="5,621 (43.8%)" value={5621} max={6000} tone="purple" />
            <MiniBar label="Support Tickets" right="2,156 (16.8%)" value={2156} max={6000} tone="blue" />
            <MiniBar label="App Store Reviews" right="1,982 (15.4%)" value={1982} max={6000} tone="green" />
            <MiniBar label="Play Store Reviews" right="1,632 (12.7%)" value={1632} max={6000} tone="amber" />
            <MiniBar label="Surveys" right="1,451 (11.3%)" value={1451} max={6000} tone="red" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Card title="Top Pain Points" action={<span className="text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer transition-colors" onClick={() => onToast('Opening Pain Points...')}>View All</span>}>
          <div className="divide-y divide-[#263348]">
            {PAIN_POINTS_DATA.slice(0, 5).map((r, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-1 transition-colors hover:bg-[#1e293b]/50 rounded cursor-pointer">
                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-violet-400" /><span className="text-[11px] font-medium text-slate-200">{r.name}</span></div>
                <div className="flex items-center gap-4 text-[10px]"><span className="text-slate-400 w-8">{r.mentions}</span><ImpactBadge value={r.impact} /><span className={r.trend.includes('↓') ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>{r.trend}</span></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Top Themes" action={<span className="text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer transition-colors" onClick={() => onToast('Opening Themes...')}>View All</span>}>
           <div className="divide-y divide-[#263348]">
            {THEMES_DATA.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-1 transition-colors hover:bg-[#1e293b]/50 rounded cursor-pointer">
                <div className="flex items-center gap-2"><Grid2X2 className="h-4 w-4 text-violet-400" /><span className="text-[11px] font-medium text-slate-200">{r.name}</span></div>
                <div className="flex items-center gap-4 text-[10px]"><span className="text-slate-400 w-8">{r.mentions}</span><span className="text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">Negative</span></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Key Insights (AI Generated)" action={<span className="text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer transition-colors">View All</span>}>
          <div className="space-y-3">
            {[ {i: TrendingDown, t: 'Negative sentiment increased by 2.2% this month, mainly due to checkout and payment related issues.', c: 'purple'}, {i: Users, t: 'Payment failures are the top complaint among enterprise customers.', c: 'green'}, {i: Activity, t: 'Order tracking delays spike on weekends and during promotional events.', c: 'blue'}, {i: Lightbulb, t: 'Improving checkout speed can significantly improve overall customer satisfaction.', c: 'amber'}].map((r, i) => (
              <div key={i} className="flex gap-3 bg-[#1e293b]/40 hover:bg-[#1e293b] p-3 rounded-lg border border-[#263348] transition-all duration-300 hover:translate-x-1">
                <r.i className={cn("h-4 w-4 mt-0.5 shrink-0", `text-${r.c}-400`)} />
                <span className="text-[11px] leading-relaxed text-slate-300">{r.t}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* =========================================
   2. PAIN POINTS TAB
   ========================================= */
function PainPointsContent({ onToast }) {
  const [selectedPainPoint, setSelectedPainPoint] = useState(PAIN_POINTS_DATA[0]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <KpiCard icon={Activity} title="Total Pain Points" value="128" trend="18.6% vs previous" tone="purple" />
        <KpiCard icon={MessageSquare} title="Total Mentions" value="12,842" trend="22.4% vs previous" tone="blue" />
        <KpiCard icon={Users} title="Customers Affected" value="9,124" trend="16.2% vs previous" tone="green" />
        <KpiCard icon={Star} title="High Impact Pain Points" value="34" sub="26.6% of total" tone="amber" />
        <KpiCard icon={TrendingDown} title="Avg. Negative Sentiment" value="-0.43" trend="6.3% vs previous" trendType="down" tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_1fr]">
        <Card title="Pain Points by Impact">
          <div className="flex h-[200px] items-center justify-around">
            <Donut segments={[{ label: 'High', value: 38, color: COLORS.red }, { label: 'Medium', value: 32, color: COLORS.amber }, { label: 'Low', value: 20, color: COLORS.blue }, { label: 'Minor', value: 10, color: COLORS.green }]} centerTop="Impact Split" centerBottom="128" size={130} />
            <div className="space-y-1.5 text-[10px]">
              <LegendRow label="High Impact (48)" value="38%" color={COLORS.red} />
              <LegendRow label="Medium Impact (41)" value="32%" color={COLORS.amber} />
              <LegendRow label="Low Impact (26)" value="20%" color={COLORS.blue} />
              <LegendRow label="Minor Impact (13)" value="10%" color={COLORS.green} />
            </div>
          </div>
        </Card>
        <Card title="Pain Points Trend Over Time" action={<span className="text-[10px] text-slate-400">Weekly ▾</span>}>
          <LineChart labels={['Jul 1', 'Jul 15', 'Jul 29', 'Aug 12', 'Aug 26']} max={200} height={200} series={[{ key: 'p', color: COLORS.red, values: [120, 140, 110, 160, 180], showDots: true }]} />
        </Card>
        <Card title="Pain Points by Source">
          <div className="flex h-[200px] flex-col justify-center space-y-3">
            <MiniBar label="In-App Feedback" right="5,621 (43.8%)" value={5621} max={6000} tone="purple" />
            <MiniBar label="Support Tickets" right="2,156 (16.8%)" value={2156} max={6000} tone="blue" />
            <MiniBar label="App Store Reviews" right="1,982 (15.4%)" value={1982} max={6000} tone="green" />
            <MiniBar label="Play Store Reviews" right="1,632 (12.7%)" value={1632} max={6000} tone="amber" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card noPadding title="">
          <div className="p-4 border-b border-[#263348] flex justify-between items-center">
            <h3 className="text-[13px] font-semibold text-slate-100">Top Pain Points (Click row to inspect)</h3>
            <span className="text-[10px] text-violet-400">View All</span>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#172033] text-slate-400 border-b border-[#263348]">
              <tr>{['Pain Point', 'Description', 'Mentions', 'Impact', 'Sentiment', 'Action'].map(h => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#263348]">
              {PAIN_POINTS_DATA.map((r) => (
                <tr key={r.id} onClick={() => setSelectedPainPoint(r)} className={cn("cursor-pointer transition-colors hover:bg-[#1e293b]", selectedPainPoint.id === r.id ? "bg-[#1e293b] border-l-4 border-violet-500" : "border-l-4 border-transparent")}>
                  <td className="px-4 py-3 font-semibold text-slate-200">{r.name}</td>
                  <td className="px-4 py-3 text-slate-400 truncate max-w-[150px]">{r.desc}</td>
                  <td className="px-4 py-3 text-slate-300">{r.mentions}</td>
                  <td className="px-4 py-3"><ImpactBadge value={r.impact} /></td>
                  <td className="px-4 py-3 text-red-400">{r.sentiment}</td>
                  <td className="px-4 py-3"><Eye className="w-4 h-4 text-violet-400 transition-transform hover:scale-125" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Pain Point Details" className="border-t-2 border-t-rose-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-white text-[13px]">{selectedPainPoint.name}</span>
            <ImpactBadge value={selectedPainPoint.impact} />
          </div>
          <p className="text-[10px] text-slate-400 mb-4">{selectedPainPoint.desc}</p>
          <div className="space-y-3 text-[11px] border-t border-[#263348] pt-3">
            <div className="flex justify-between"><span className="text-slate-400">Total Mentions</span><span className="text-white font-medium">{selectedPainPoint.mentions}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Customers Affected</span><span className="text-white font-medium">{selectedPainPoint.affected}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Avg. Sentiment</span><span className="text-red-400 font-medium">{selectedPainPoint.sentiment}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Trend</span><span className="text-green-400 font-medium">{selectedPainPoint.trend}</span></div>
          </div>
          <div className="mt-4">
            <span className="text-[10px] text-slate-400 block mb-2 font-medium">Top Related Themes</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedPainPoint.themes.map(t => <span key={t} className="bg-rose-950/40 border border-rose-900/50 text-rose-300 px-2 py-0.5 rounded text-[10px] transition-transform hover:scale-105">{t}</span>)}
            </div>
          </div>
          <button onClick={() => onToast(`Viewing feedback for ${selectedPainPoint.name}`)} className="w-full mt-5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2.5 text-[11px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99] shadow flex items-center justify-center gap-2">
            <FileText className="w-3.5 h-3.5"/> View Related Feedback ({selectedPainPoint.mentions})
          </button>
        </Card>
      </div>
    </div>
  );
}

/* =========================================
   3. TRENDS TAB
   ========================================= */
function TrendsContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard icon={TrendingUp} title="Increasing Trends" value="86" sub="66% of total trends" tone="green" />
        <KpiCard icon={TrendingDown} title="Decreasing Trends" value="28" sub="22% of total trends" tone="red" />
        <KpiCard icon={Activity} title="Stable Trends" value="13" sub="10% of total trends" tone="blue" />
        <KpiCard icon={Sparkles} title="New Trends Detected" value="17" sub="21.4% vs previous" tone="purple" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Mentions Trend Over Time" action={<span className="text-[10px] text-slate-400">Daily ▾</span>}>
          <LineChart labels={['Jul 1', 'Jul 15', 'Jul 29', 'Aug 12', 'Aug 26']} max={4000} height={200} series={[{ key: 't', color: COLORS.purple, values: [1200, 2100, 1800, 2900, 3400], showDots: true }]} />
        </Card>
        <Card title="Trend Direction Over Time" action={<span className="text-[10px] text-slate-400">Weekly ▾</span>}>
          <div className="h-[200px] flex items-center justify-center text-slate-500 text-[11px]">
            <div className="w-full flex justify-around items-end h-36 px-4">
              {['Jul 1-4', 'Jul 7-10', 'Jul 14-17', 'Jul 21-24', 'Jul 28-31', 'Aug 4-7', 'Aug 11-14', 'Aug 18-21', 'Aug 25-28'].map((lbl, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 w-6 group/baritem">
                  <div className="w-full flex flex-col h-28 bg-[#1e293b] rounded-md overflow-hidden justify-end transition-all duration-300 group-hover/baritem:scale-y-105">
                    <div className="bg-green-500 w-full" style={{ height: '55%' }} />
                    <div className="bg-yellow-500 w-full" style={{ height: '25%' }} />
                    <div className="bg-red-500 w-full" style={{ height: '20%' }} />
                  </div>
                  <span className="text-[8px] text-slate-500 truncate">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Top Increasing Trends">
          <div className="space-y-2.5 pt-1">
            {[['Slow Checkout Process', 'Checkout', '1,842', '↑ 28%', 'High'], ['Payment Failures', 'Payments', '1,231', '↑ 15%', 'High'], ['Delayed Order Tracking', 'Tracking', '978', '↑ 17%', 'Medium']].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#1e293b]/30 hover:bg-[#1e293b] rounded-lg border border-[#263348] transition-all hover:translate-x-1">
                <div><div className="text-[11px] font-semibold text-white">{t[0]}</div><div className="text-[9px] text-slate-400">Category: {t[1]} | Mentions: {t[2]}</div></div>
                <div className="flex items-center gap-3"><span className="text-green-400 font-bold text-[10px]">{t[3]}</span><ImpactBadge value={t[4]}/></div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Top Decreasing Trends">
          <div className="space-y-2.5 pt-1">
            {[['Login Issues', 'Account', '421', '↓ 18%', 'Low'], ['Search Accuracy', 'Search', '312', '↓ 10%', 'Low'], ['Coupon Code Errors', 'Promotions', '280', '↓ 12%', 'Low']].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#1e293b]/30 hover:bg-[#1e293b] rounded-lg border border-[#263348] transition-all hover:translate-x-1">
                <div><div className="text-[11px] font-semibold text-white">{t[0]}</div><div className="text-[9px] text-slate-400">Category: {t[1]} | Mentions: {t[2]}</div></div>
                <div className="flex items-center gap-3"><span className="text-red-400 font-bold text-[10px]">{t[3]}</span><ImpactBadge value={t[4]}/></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* =========================================
   4. THEMES TAB
   ========================================= */
function ThemesContent({ onToast }) {
  const [selectedTheme, setSelectedTheme] = useState(THEMES_DATA[0]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <KpiCard icon={Grid2X2} title="Total Themes" value="24" trend="20% vs previous" tone="purple" />
        <KpiCard icon={MessageSquare} title="Total Mentions" value="12,842" trend="18.6% vs previous" tone="blue" />
        <KpiCard icon={Users} title="Unique Customers" value="9,812" trend="16.4% vs previous" tone="green" />
        <KpiCard icon={LineChartIcon} title="Avg. Mentions / Theme" value="535" trend="8.7% vs previous" tone="amber" />
        <KpiCard icon={Target} title="High Impact Themes" value="6" sub="25% of total themes" tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <Card title="Top Themes by Mentions">
          <div className="space-y-3.5 pt-1">
            {THEMES_DATA.map((r,i) => (
              <div key={i} className="flex items-center gap-3 group/item">
                <span className="w-28 truncate text-[10px] text-slate-300 group-hover/item:text-white transition-colors">{r.name}</span>
                <div className="flex-1 h-2 bg-[#1e293b] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500 group-hover/item:brightness-125" style={{width:`${(parseInt(r.mentions.replace(',',''))/3000)*100}%`, background: COLORS.purple}}/></div>
                <span className="w-16 text-right text-[10px] text-slate-400 font-semibold">{r.mentions}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Theme Mentions Over Time" action={<span className="text-[10px] text-slate-400">Daily ▾</span>}>
          <LineChart labels={['Jul 1', 'Jul 15', 'Jul 29', 'Aug 12', 'Aug 26']} max={1250} height={180} series={[{ key: '1', color: COLORS.purple, values: [700, 800, 1100, 900, 1200] }, { key: '2', color: COLORS.blue, values: [500, 600, 700, 650, 800] }]} />
        </Card>
        <Card title="Theme Distribution by Impact">
          <div className="flex h-[180px] items-center justify-around">
            <Donut segments={[{ label: 'High', value: 25, color: COLORS.red }, { label: 'Medium', value: 33, color: COLORS.amber }, { label: 'Low', value: 25, color: COLORS.blue }, { label: 'Minor', value: 17, color: COLORS.green }]} centerTop="Themes" centerBottom="24" size={120} />
            <div className="space-y-1 text-[10px]">
              <LegendRow label="High (6)" value="25%" color={COLORS.red} />
              <LegendRow label="Medium (8)" value="33%" color={COLORS.amber} />
              <LegendRow label="Low (6)" value="25%" color={COLORS.blue} />
              <LegendRow label="Minor (4)" value="17%" color={COLORS.green} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card noPadding title="">
          <div className="p-4 border-b border-[#263348] flex justify-between items-center">
            <h3 className="text-[13px] font-semibold text-slate-100">All Themes (Click to inspect)</h3>
            <span className="text-[10px] text-violet-400">View All</span>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#172033] text-slate-400 border-b border-[#263348]">
              <tr>{['Theme', 'Mentions', 'Sentiment', 'Impact', 'Trend'].map(h => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#263348]">
              {THEMES_DATA.map((r) => (
                <tr key={r.id} onClick={() => setSelectedTheme(r)} className={cn("cursor-pointer transition-colors hover:bg-[#1e293b]", selectedTheme.id === r.id ? "bg-[#1e293b] border-l-4 border-violet-500" : "border-l-4 border-transparent")}>
                  <td className="px-4 py-3 font-semibold text-slate-200">{r.name}</td>
                  <td className="px-4 py-3 text-slate-400">{r.mentions} ({r.percentage})</td>
                  <td className="px-4 py-3 text-red-400">{r.sentiment}</td>
                  <td className="px-4 py-3"><ImpactBadge value={r.impact} /></td>
                  <td className="px-4 py-3 text-green-400 font-medium">{r.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Theme Details" className="border-t-2 border-t-violet-500">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-[13px]">{selectedTheme.name}</span>
            <ImpactBadge value={selectedTheme.impact} />
          </div>
          <p className="text-[10px] text-slate-400 mb-4">{selectedTheme.desc}</p>
          <div className="space-y-2.5 text-[11px] border-t border-[#263348] pt-3">
            <div className="flex justify-between"><span className="text-slate-400">Total Mentions</span><span className="text-white font-medium">{selectedTheme.mentions}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Unique Customers</span><span className="text-white font-medium">{selectedTheme.customers}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Avg. Sentiment</span><span className="text-red-400 font-medium">{selectedTheme.sentiment}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Trend</span><span className="text-green-400 font-medium">{selectedTheme.trend}</span></div>
          </div>
          <div className="mt-4">
            <span className="text-[10px] text-slate-400 block mb-2 font-medium">Top Related Pain Points</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedTheme.painPoints.map(t => <span key={t} className="bg-violet-950/40 border border-violet-900/50 text-violet-300 px-2 py-0.5 rounded text-[10px] transition-transform hover:scale-105">{t}</span>)}
            </div>
          </div>
          <button onClick={() => onToast(`Viewing feedback for theme ${selectedTheme.name}`)} className="w-full mt-5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2.5 text-[11px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99] shadow flex items-center justify-center gap-2">
            <FileText className="w-3.5 h-3.5"/> View Related Feedback ({selectedTheme.mentions})
          </button>
        </Card>
      </div>
    </div>
  );
}

/* =========================================
   5. SENTIMENT TAB
   ========================================= */
function SentimentContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <KpiCard icon={Star} title="Overall Sentiment Score" value="+0.42" sub="Positive" trend="0.08 vs previous" tone="green" />
        <KpiCard icon={CheckCircle2} title="Positive" value="35%" sub="4,487 mentions" trend="4.3%" tone="green" />
        <KpiCard icon={MoreHorizontal} title="Neutral" value="24%" sub="3,083 mentions" trend="2.1%" trendType="down" tone="amber" />
        <KpiCard icon={TrendingDown} title="Negative" value="41%" sub="5,272 mentions" trend="2.2%" trendType="down" tone="red" />
        <KpiCard icon={MessageSquare} title="Total Mentions" value="12,842" trend="18.6%" tone="blue" />
        <KpiCard icon={Users} title="Unique Customers" value="9,812" trend="16.4%" tone="purple" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1.2fr]">
        <Card title="Sentiment Trend Over Time" action={<span className="text-[10px] text-slate-400">Daily ▾</span>}>
          <LineChart labels={['Jul 1', 'Jul 15', 'Jul 29', 'Aug 12', 'Aug 26']} min={0} max={80} height={190} series={[{ key: 'pos', color: COLORS.green, values: [30, 25, 35, 30, 38], showDots: true }, { key: 'neg', color: COLORS.red, values: [45, 48, 42, 50, 41], showDots: true }]} />
        </Card>
        <Card title="Sentiment Distribution">
          <div className="flex h-[190px] items-center justify-around">
            <Donut segments={[{ label: 'Positive', value: 35, color: COLORS.green }, { label: 'Neutral', value: 24, color: COLORS.amber }, { label: 'Negative', value: 41, color: COLORS.red }]} centerTop="Total" centerBottom="12,842" size={120} />
            <div className="space-y-1 text-[10px]">
              <LegendRow label="Positive" value="35%" color={COLORS.green} />
              <LegendRow label="Neutral" value="24%" color={COLORS.amber} />
              <LegendRow label="Negative" value="41%" color={COLORS.red} />
            </div>
          </div>
        </Card>
        <Card title="Sentiment Score Over Time" action={<span className="text-[10px] text-slate-400">Daily ▾</span>}>
          <LineChart labels={['Jul 1', 'Jul 15', 'Jul 29', 'Aug 12', 'Aug 26']} min={-1} max={1} height={190} series={[{ key: 'score', color: COLORS.purple, values: [-0.5, 0.0, 0.2, 0.5, 0.42], showDots: true }]} />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card noPadding title="">
          <div className="p-4 border-b border-[#263348]"><h3 className="text-[13px] font-semibold text-slate-100">Sentiment by Source</h3></div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#172033] text-slate-400 border-b border-[#263348]">
              <tr>{['Source', 'Total Mentions', 'Positive', 'Neutral', 'Negative', 'Score'].map(h => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#263348]">
              {[['In-App Feedback', '5,621 (43.8%)', '38%', '22%', '40%', '+0.38'], ['Support Tickets', '2,156 (16.8%)', '32%', '23%', '45%', '-0.12'], ['App Store Reviews', '1,982 (15.4%)', '42%', '26%', '32%', '+0.21']].map((r, i) => (
                <tr key={i} className="hover:bg-[#1e293b] transition-colors">
                  <td className="px-3 py-3 text-slate-200">{r[0]}</td>
                  <td className="px-3 py-3 text-slate-400">{r[1]}</td>
                  <td className="px-3 py-3 text-green-400">{r[2]}</td>
                  <td className="px-3 py-3 text-yellow-400">{r[3]}</td>
                  <td className="px-3 py-3 text-red-400">{r[4]}</td>
                  <td className="px-3 py-3 font-semibold text-slate-200">{r[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card noPadding title="">
          <div className="p-4 border-b border-[#263348]"><h3 className="text-[13px] font-semibold text-slate-100">Sentiment by Customer Segment</h3></div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#172033] text-slate-400 border-b border-[#263348]">
              <tr>{['Segment', 'Total Mentions', 'Positive', 'Neutral', 'Negative', 'Score'].map(h => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#263348]">
              {[['Enterprise', '4,128 (32.1%)', '37%', '22%', '41%', '+0.28'], ['Business', '3,582 (27.9%)', '36%', '24%', '40%', '+0.19'], ['Consumers', '3,941 (30.7%)', '34%', '25%', '41%', '+0.06']].map((r, i) => (
                <tr key={i} className="hover:bg-[#1e293b] transition-colors">
                  <td className="px-3 py-3 text-slate-200">{r[0]}</td>
                  <td className="px-3 py-3 text-slate-400">{r[1]}</td>
                  <td className="px-3 py-3 text-green-400">{r[2]}</td>
                  <td className="px-3 py-3 text-yellow-400">{r[3]}</td>
                  <td className="px-3 py-3 text-red-400">{r[4]}</td>
                  <td className="px-3 py-3 font-semibold text-slate-200">{r[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Top Positive Topics">
          <div className="space-y-2.5 pt-1 text-[11px]">
            {[['Easy to Use', '1,247', '+0.78'], ['Fast Checkout', '1,103', '+0.65'], ['Great Support', '825', '+0.61']].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-1 rounded hover:bg-[#1e293b]/50 transition-colors"><span className="text-slate-300">{t[0]}</span><span className="text-slate-400">{t[1]}</span><span className="text-green-400 font-semibold">{t[2]}</span></div>
            ))}
          </div>
        </Card>
        <Card title="Top Negative Topics">
          <div className="space-y-2.5 pt-1 text-[11px]">
            {[['Slow Checkout Process', '1,842', '-0.78'], ['Payment Failures', '1,231', '-0.72'], ['App Crashes', '978', '-0.69']].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-1 rounded hover:bg-[#1e293b]/50 transition-colors"><span className="text-slate-300">{t[0]}</span><span className="text-slate-400">{t[1]}</span><span className="text-red-400 font-semibold">{t[2]}</span></div>
            ))}
          </div>
        </Card>
        <Card title="Recent Sentiment Insights (AI)">
          <div className="space-y-2 text-[10px] text-slate-300">
            <div className="p-2.5 bg-[#1e293b]/40 rounded-lg border border-[#263348] transition-all hover:translate-x-1">Overall sentiment improved by 0.08 this month driven by better checkout experience.</div>
            <div className="p-2.5 bg-[#1e293b]/40 rounded-lg border border-[#263348] transition-all hover:translate-x-1">Payment failures and slow checkout remain the biggest negative drivers.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* =========================================
   6. SEGMENTS TAB
   ========================================= */
function SegmentsContent() {
  const [subSegmentTab, setSubSegmentTab] = useState('Overview');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-b border-[#263348] pb-2 text-[11px] overflow-x-auto">
        {['Overview', 'Customer Segments', 'Product Segments', 'Geography', 'Company Size', 'User Role', 'Custom Segments'].map((tab) => (
          <button key={tab} onClick={() => setSubSegmentTab(tab)} className={cn("pb-2 transition-all font-medium whitespace-nowrap", subSegmentTab === tab ? "text-violet-400 border-b-2 border-violet-500" : "text-slate-400 hover:text-slate-200")}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6 mt-2">
        <KpiCard icon={Users} title="Total Segments" value="6" sub="5 customer + 1 product" tone="purple" />
        <KpiCard icon={MessageSquare} title="Total Mentions" value="12,842" trend="18.6% vs previous" tone="green" />
        <KpiCard icon={Users} title="Unique Customers" value="9,812" trend="16.4% vs previous" tone="blue" />
        <KpiCard icon={LineChartIcon} title="Avg. Mentions / Segment" value="2,140" trend="8.2% vs previous" tone="amber" />
        <KpiCard icon={Target} title="Top Segment by Impact" value="Enterprise" sub="Impact Score: 86" tone="red" />
        <KpiCard icon={Activity} title="Most Active Segment" value="Business Users" sub="4,521 mentions" tone="cyan" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card noPadding title="">
          <div className="p-4 border-b border-[#263348]"><h3 className="text-[13px] font-semibold text-slate-100">Segment Performance ({subSegmentTab})</h3></div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#172033] text-slate-400 border-b border-[#263348]">
              <tr>{['Segment', 'Total Mentions', '% Share', 'Unique Customers', 'Sentiment Score', 'Impact Score'].map(h => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#263348]">
              {[['Enterprise', '3,870', '30.1%', '2,341', '-0.18 Negative', '86 High'], ['Business Users', '4,521', '35.2%', '3,582', '-0.08 Negative', '82 High'], ['Consumers', '2,341', '18.2%', '2,991', '-0.12 Negative', '68 Medium'], ['SMB', '1,213', '9.4%', '1,023', '+0.02 Neutral', '58 Medium']].map((r, i) => (
                <tr key={i} className="hover:bg-[#1e293b] transition-colors">
                  <td className="px-3 py-3 font-semibold text-slate-200">{r[0]}</td>
                  <td className="px-3 py-3 text-slate-400">{r[1]}</td>
                  <td className="px-3 py-3 text-slate-400">{r[2]}</td>
                  <td className="px-3 py-3 text-slate-400">{r[3]}</td>
                  <td className="px-3 py-3 text-red-400">{r[4]}</td>
                  <td className="px-3 py-3 text-green-400 font-semibold">{r[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Sentiment by Segment">
          <div className="flex h-[190px] items-center justify-around">
            <Donut segments={[{ label: 'Positive', value: 35, color: COLORS.green }, { label: 'Neutral', value: 24, color: COLORS.amber }, { label: 'Negative', value: 41, color: COLORS.red }]} centerTop="Mentions" centerBottom="12,842" size={130} />
            <div className="space-y-2 text-[11px]">
              <LegendRow label="Positive" value="35%" color={COLORS.green} />
              <LegendRow label="Neutral" value="24%" color={COLORS.amber} />
              <LegendRow label="Negative" value="41%" color={COLORS.red} />
            </div>
          </div>
        </Card>
      </div>

      <Card title="Segment Insights (AI Generated)">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
          {['Enterprise segment has highest impact score (86) driven by payment and checkout issues.', 'Business Users are the most active segment with 4,521 mentions (35.2% share).', 'Consumers show improving sentiment compared to last month (+0.05 improvement).', 'New Users sentiment is positive (+0.10) indicating a good onboarding experience.', 'Payment failures and checkout issues are top concerns across all segments.'].map((txt, idx) => (
            <div key={idx} className="bg-[#1e293b]/40 hover:bg-[#1e293b] p-3 rounded-lg border border-[#263348] text-[11px] text-slate-300 transition-all duration-300 hover:-translate-y-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 mb-1.5"/>
              {txt}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* =========================================
   7. COMPARISONS TAB
   ========================================= */
function ComparisonsContent({ onToast }) {
  const [compTab, setCompTab] = useState('Time Comparison');
  const [activeRange, setActiveRange] = useState('Last 30 Days');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-b border-[#263348] pb-2 text-[11px] overflow-x-auto">
        {['Time Comparison', 'Segment Comparison', 'Product Comparison', 'Custom Comparison'].map((tab) => (
          <button key={tab} onClick={() => setCompTab(tab)} className={cn("pb-2 transition-all font-medium whitespace-nowrap", compTab === tab ? "text-violet-400 border-b-2 border-violet-500" : "text-slate-400 hover:text-slate-200")}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5 mt-2">
        <KpiCard icon={MessageSquare} title="Total Mentions" value="12,842" trend="18.6% vs previous" tone="blue" />
        <KpiCard icon={Users} title="Unique Customers" value="9,812" trend="16.4% vs previous" tone="purple" />
        <KpiCard icon={TrendingDown} title="Negative Sentiment" value="41%" trend="2.2% vs previous" trendType="down" tone="red" />
        <KpiCard icon={Target} title="Avg. Impact Score" value="72" trend="8.7% vs previous" tone="amber" />
        <KpiCard icon={FileText} title="New Themes" value="14" trend="27.3% vs previous" tone="green" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card noPadding title="">
          <div className="p-4 border-b border-[#263348]"><h3 className="text-[13px] font-semibold text-slate-100">Key Metrics Comparison ({compTab})</h3></div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#172033] text-slate-400 border-b border-[#263348]">
              <tr>{['Metric', 'Jul 1 – Aug 31, 2025', 'May 1 – Jun 30, 2025', 'Change'].map(h => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#263348]">
              {[['Total Mentions', '12,842', '10,828', '↑ 18.6%'], ['Unique Customers', '9,812', '8,431', '↑ 16.4%'], ['Negative Sentiment', '5,272 (41%)', '5,157 (47.6%)', '↑ 2.2%'], ['Positive Sentiment', '4,487 (35%)', '3,401 (31.4%)', '↑ 4.3%']].map((r, i) => (
                <tr key={i} className="hover:bg-[#1e293b] transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-200">{r[0]}</td>
                  <td className="px-4 py-3 text-slate-300">{r[1]}</td>
                  <td className="px-4 py-3 text-slate-400">{r[2]}</td>
                  <td className="px-4 py-3 text-green-400 font-semibold">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Compare Configuration" className="border-t-2 border-t-blue-500">
          <div className="space-y-3 text-[11px] pt-1">
            <div><label className="text-slate-400 block mb-1 font-medium">Comparison Type</label><div className="bg-[#1e293b] p-2 rounded text-white font-medium flex justify-between items-center">{compTab} <ChevronDown className="w-3.5 h-3.5 text-slate-400"/></div></div>
            <div><label className="text-slate-400 block mb-1 font-medium">Current Period</label><div className="bg-[#1e293b] p-2 rounded text-white font-medium flex justify-between items-center">Jul 1 – Aug 31, 2025 <CalendarDays className="w-3.5 h-3.5 text-slate-400"/></div></div>
            <div><label className="text-slate-400 block mb-1 font-medium">Previous Period</label><div className="bg-[#1e293b] p-2 rounded text-white font-medium flex justify-between items-center">May 1 – Jun 30, 2025 <CalendarDays className="w-3.5 h-3.5 text-slate-400"/></div></div>
            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">Quick Ranges</label>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'MTD', 'QTD', 'YTD'].map((r) => (
                  <button key={r} onClick={() => setActiveRange(r)} className={cn("py-1.5 rounded font-medium transition-all duration-300", activeRange === r ? "bg-violet-600 text-white shadow scale-105" : "bg-[#1e293b] text-slate-300 hover:bg-[#263348]")}>{r}</button>
                ))}
              </div>
            </div>
            <button onClick={() => onToast(`Applied comparison for range: ${activeRange}`)} className="w-full mt-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2.5 font-medium transition-all hover:scale-[1.01] active:scale-[0.99] shadow flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5"/> Apply Comparison
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* =========================================
   MAIN APP CONTAINER
   ========================================= */
export default function InsightsDashboard() {
  const [activeTab, setActiveTab] = useLocalTab();
  const [globalDateRange, setGlobalDateRange] = useState('Jul 1 – Aug 31, 2025');
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const content = useMemo(() => {
    const props = { onToast: triggerToast };
    switch (activeTab) {
      case 'Overview': return <OverviewContent {...props} />;
      case 'Pain Points': return <PainPointsContent {...props} />;
      case 'Trends': return <TrendsContent {...props} />;
      case 'Themes': return <ThemesContent {...props} />;
      case 'Sentiment': return <SentimentContent {...props} />;
      case 'Segments': return <SegmentsContent {...props} />;
      case 'Comparisons': return <ComparisonsContent {...props} />;
      default: return <OverviewContent {...props} />;
    }
  }, [activeTab]);

  return (
    <div className="w-full bg-transparent text-slate-300 font-sans flex flex-col space-y-1 pb-12">
      {/* Title & Header Actions */}
      <div className="py-4 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">{activeTab}</h1>
          <p className="text-[11px] text-slate-400 mt-1">Analyze customer feedback to understand overall satisfaction and emotional trends.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={() => triggerToast('Date picker modal opened')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-2 rounded-lg text-[10px] text-slate-300 hover:text-white transition-colors hover:border-violet-500/50">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400"/> {globalDateRange} <ChevronDown className="w-3 h-3 text-slate-500"/>
          </button>
          <button onClick={() => triggerToast('Filter panel opened')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-2 rounded-lg text-[10px] text-slate-300 hover:text-white transition-colors hover:border-violet-500/50">
            <Filter className="w-3.5 h-3.5 text-slate-400"/> Filters
          </button>
          <button onClick={() => triggerToast('AI Assistant is processing queries...')} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-2 rounded-lg text-[10px] text-slate-300 hover:text-white transition-colors hover:border-violet-500/50">
            <Sparkles className="w-3.5 h-3.5 text-violet-400"/> AI Assistant
          </button>
          <button onClick={() => triggerToast('Exporting Report successfully...')} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-[10px] font-medium text-white transition-all shadow-lg hover:scale-105 active:scale-95">
            <Download className="w-3.5 h-3.5"/> Export Report
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-6 border-b border-[#263348] mb-6 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={cn(
              "pb-3 text-[12px] font-medium relative transition-colors whitespace-nowrap cursor-pointer", 
              activeTab === tab ? "text-violet-400" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-t-md shadow-[0_0_8px_rgba(139,92,246,0.6)] transition-all" />
            )}
          </button>
        ))}
      </div>

      {/* Active Tab View */}
      <div className="w-full">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : content}
      </div>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 bg-[#111827] border border-violet-500/30 px-4 py-3 rounded-xl shadow-2xl transition-all">
          <Sparkles className="w-4 h-4 text-violet-400"/>
          <span className="text-[11px] font-medium text-slate-100">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}