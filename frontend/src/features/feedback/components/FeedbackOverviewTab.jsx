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
  loading = false,
  recentFeedback = [],
  onSelectFeedback,
  onNavigateToAll,
}) {
  const hasMetrics = metrics != null && metrics.total_feedback !== undefined;
  const total = hasMetrics ? metrics.total_feedback : null;
  const newWeek = hasMetrics ? metrics.new_this_week : null;
  const posPct = hasMetrics ? metrics.positive_pct : null;
  const posCount = hasMetrics ? metrics.positive_count : null;
  const neuPct = hasMetrics ? metrics.neutral_pct : null;
  const neuCount = hasMetrics ? metrics.neutral_count : null;
  const negPct = hasMetrics ? metrics.negative_pct : null;
  const negCount = hasMetrics ? metrics.negative_count : null;

  const trendData = metrics?.trend?.length ? metrics.trend : [];

  const sourceData = metrics?.source_distribution?.length
    ? metrics.source_distribution.map((s, idx) => ({
        name: s.source,
        value: s.percentage,
        count: s.count,
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
      }))
    : [];

  const dateRangeLabel = trendData.length > 1
    ? `${trendData[0]?.date || ''} - ${trendData[trendData.length - 1]?.date || ''}`
    : trendData.length === 1
    ? trendData[0]?.date
    : null;

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
            <div className="text-2xl font-bold text-white tracking-tight">
              {total != null ? total.toLocaleString() : (loading ? '...' : '--')}
            </div>
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <span>{hasMetrics && total > 0 ? `${total} verified records` : '--'}</span>
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
            <div className="text-2xl font-bold text-white tracking-tight">
              {newWeek != null ? newWeek.toLocaleString() : (loading ? '...' : '--')}
            </div>
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <span>{newWeek != null ? `${newWeek} recent entries` : '--'}</span>
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
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {posPct != null ? `${posPct}%` : (loading ? '...' : '--')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {posCount != null ? `${posCount.toLocaleString()} feedback` : '-- feedback'}
            </div>
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
            <div className="text-2xl font-bold text-amber-400 tracking-tight">
              {neuPct != null ? `${neuPct}%` : (loading ? '...' : '--')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {neuCount != null ? `${neuCount.toLocaleString()} feedback` : '-- feedback'}
            </div>
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
            <div className="text-2xl font-bold text-red-400 tracking-tight">
              {negPct != null ? `${negPct}%` : (loading ? '...' : '--')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {negCount != null ? `${negCount.toLocaleString()} feedback` : '-- feedback'}
            </div>
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
              <p className="text-[11px] text-slate-400">
                {dateRangeLabel ? `Sentiment velocity (${dateRangeLabel})` : 'Cumulative sentiment velocity'}
              </p>
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

          <div className="h-[210px] w-full flex items-center justify-center">
            {trendData.length > 0 ? (
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
            ) : (
              <div className="text-center text-slate-500 text-xs py-10">
                <TrendingUp className="w-6 h-6 mx-auto mb-1.5 text-slate-600 opacity-60" />
                <span>No trend velocity data available for this batch (--)</span>
              </div>
            )}
          </div>
        </div>

        {/* Source Donut (col-span-4) */}
        <div className="lg:col-span-4 bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 shadow-xl flex flex-col justify-between">
          <div className="border-b border-[#1a2338] pb-2.5 mb-2">
            <h3 className="text-xs font-semibold text-white">Feedback by Source</h3>
            <p className="text-[11px] text-slate-400">Distribution across intake channels</p>
          </div>

          {sourceData.length > 0 ? (
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
                    {total != null ? total.toLocaleString() : '--'}
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
          ) : (
            <div className="h-[160px] flex flex-col items-center justify-center text-center text-slate-500 text-xs">
              <span className="text-xl font-bold text-slate-600 mb-1">--</span>
              <span>No source distribution available</span>
            </div>
          )}
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
              {recentFeedback.length > 0 ? (
                recentFeedback.slice(0, 5).map((item) => (
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
                      {item.date_str || '--'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 text-xs">
                    No feedback records found for this dataset or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

