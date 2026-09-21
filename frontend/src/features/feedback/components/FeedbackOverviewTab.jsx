import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  ExternalLink,
} from 'lucide-react';
import { SentimentBadge, SourceBadge } from './FeedbackBadges';

const DONUT_COLORS = ['#38bdf8', '#34d399', '#a855f7', '#fbbf24', '#ec4899', '#64748b'];

export default function FeedbackOverviewTab({
  metrics,
  recentFeedback = [],
  onSelectFeedback,
  onNavigateToAll,
}) {
  const total = metrics?.total_feedback ?? 1248;
  const newWeek = metrics?.new_this_week ?? 124;
  const posPct = metrics?.positive_pct ?? 52;
  const posCount = metrics?.positive_count ?? 649;
  const neuPct = metrics?.neutral_pct ?? 28;
  const neuCount = metrics?.neutral_count ?? 349;
  const negPct = metrics?.negative_pct ?? 20;
  const negCount = metrics?.negative_count ?? 250;

  const trendData = metrics?.trend?.length
    ? metrics.trend
    : [
        { date: 'Jul 1', positive: 80, neutral: 45, negative: 30 },
        { date: 'Jul 5', positive: 120, neutral: 60, negative: 45 },
        { date: 'Jul 10', positive: 210, neutral: 110, negative: 85 },
        { date: 'Jul 15', positive: 340, neutral: 180, negative: 130 },
        { date: 'Jul 20', positive: 450, neutral: 250, negative: 180 },
        { date: 'Jul 25', positive: 560, neutral: 300, negative: 220 },
        { date: 'Jul 31', positive: 649, neutral: 349, negative: 250 },
      ];

  const sourceData = metrics?.source_distribution?.length
    ? metrics.source_distribution.map((s, idx) => ({
        name: s.source,
        value: s.percentage,
        count: s.count,
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
      }))
    : [
        { name: 'App Store', value: 32, color: '#38bdf8' },
        { name: 'Play Store', value: 24, color: '#34d399' },
        { name: 'Support', value: 18, color: '#a855f7' },
        { name: 'Surveys', value: 14, color: '#fbbf24' },
        { name: 'Social Media', value: 8, color: '#ec4899' },
        { name: 'Others', value: 4, color: '#64748b' },
      ];

  return (
    <div className="space-y-6">
      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Feedback */}
        <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Feedback</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white tracking-tight">{total.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>15% vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: New This Week */}
        <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>New This Week</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white tracking-tight">{newWeek}</div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>12% vs last week</span>
            </div>
          </div>
        </div>

        {/* Card 3: Positive */}
        <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Positive
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Smile className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{posPct}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{posCount.toLocaleString()} feedback</div>
          </div>
        </div>

        {/* Card 4: Neutral */}
        <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Neutral
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Meh className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-400 tracking-tight">{neuPct}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{neuCount.toLocaleString()} feedback</div>
          </div>
        </div>

        {/* Card 5: Negative */}
        <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Negative
            </span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <Frown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-red-400 tracking-tight">{negPct}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{negCount.toLocaleString()} feedback</div>
          </div>
        </div>
      </div>

      {/* 2 Main Charts: Feedback Trend & Feedback by Source */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Trend Chart (col-span-8) */}
        <div className="lg:col-span-8 bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-[#1a2338] pb-2.5">
            <div>
              <h3 className="text-xs font-semibold text-white">Feedback Trend</h3>
              <p className="text-[11px] text-slate-400">Cumulative sentiment velocity (Jul 1 - Jul 31)</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Positive
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Neutral
              </span>
              <span className="flex items-center gap-1 text-red-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Negative
              </span>
            </div>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2338" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    borderColor: '#232f48',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Line type="monotone" dataKey="positive" stroke="#34d399" strokeWidth={2.2} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="neutral" stroke="#fbbf24" strokeWidth={2.2} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="negative" stroke="#f87171" strokeWidth={2.2} dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Donut (col-span-4) */}
        <div className="lg:col-span-4 bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 shadow-xl flex flex-col justify-between">
          <div className="border-b border-[#1a2338] pb-2.5 mb-2">
            <h3 className="text-xs font-semibold text-white">Feedback by Source</h3>
            <p className="text-[11px] text-slate-400">Distribution across incoming intake channels</p>
          </div>

          <div className="grid grid-cols-12 items-center gap-2 my-auto">
            <div className="col-span-6 h-[160px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0f1d',
                      borderColor: '#232f48',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-bold text-white tracking-tight leading-none">
                  {total.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">Total</span>
              </div>
            </div>

            <div className="col-span-6 space-y-1 text-[11px]">
              {sourceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-semibold text-white text-[10.5px]">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Feedback Preview Section */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-[#1a2338] pb-2.5">
          <div>
            <h3 className="text-xs font-semibold text-white">Recent Feedback</h3>
            <p className="text-[11px] text-slate-400">Latest customer voices ingested across platforms</p>
          </div>
          <button
            onClick={onNavigateToAll}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 text-[10.5px] border-b border-[#1a2338]/80">
                <th className="pb-2 font-medium w-16">ID</th>
                <th className="pb-2 font-medium">Feedback</th>
                <th className="pb-2 font-medium w-36">Source</th>
                <th className="pb-2 font-medium w-28">Sentiment</th>
                <th className="pb-2 font-medium w-28">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2338]/60 text-[11px]">
              {recentFeedback.slice(0, 5).map((item) => (
                <tr
                  key={item.feedback_id}
                  onClick={() => onSelectFeedback(item)}
                  className="hover:bg-[#151d30]/60 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 font-mono text-[10.5px] text-indigo-400 font-medium group-hover:underline">
                    {item.feedback_id}
                  </td>
                  <td className="py-2.5 text-slate-200 pr-3 font-normal max-w-md truncate">
                    {item.text}
                  </td>
                  <td className="py-2.5">
                    <SourceBadge source={item.source} />
                  </td>
                  <td className="py-2.5">
                    <SentimentBadge sentiment={item.sentiment} />
                  </td>
                  <td className="py-2.5 text-slate-400 text-[10px] font-mono">
                    {item.date_str}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

