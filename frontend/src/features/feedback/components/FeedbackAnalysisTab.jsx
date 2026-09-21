import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import {
  Sparkles,
  ArrowRight,
  BarChart3,
  Smile,
  Hash,
  Cloud,
  Lightbulb,
} from 'lucide-react';

const SENTIMENT_COLORS = {
  Positive: '#34d399',
  Neutral: '#fbbf24',
  Negative: '#f87171',
};

export default function FeedbackAnalysisTab({
  metrics,
  onViewThemeDetails,
}) {
  const [subTab, setSubTab] = useState('themes'); // themes, sentiment, topics, wordcloud, ai_insights

  const total = metrics?.total_feedback ?? 1248;

  const themesData = metrics?.top_themes?.length
    ? metrics.top_themes
    : [
        { theme: 'Checkout & Payments', percentage: 28, count: 349 },
        { theme: 'Performance & Speed', percentage: 18, count: 224 },
        { theme: 'UI/UX', percentage: 14, count: 175 },
        { theme: 'Product Features', percentage: 12, count: 150 },
        { theme: 'Pricing', percentage: 10, count: 125 },
        { theme: 'Account & Login', percentage: 8, count: 100 },
        { theme: 'Others', percentage: 8, count: 100 },
      ];

  const sentimentData = [
    {
      name: 'Positive',
      value: metrics?.positive_pct ?? 52,
      count: metrics?.positive_count ?? 649,
      color: SENTIMENT_COLORS.Positive,
    },
    {
      name: 'Neutral',
      value: metrics?.neutral_pct ?? 28,
      count: metrics?.neutral_count ?? 349,
      color: SENTIMENT_COLORS.Neutral,
    },
    {
      name: 'Negative',
      value: metrics?.negative_pct ?? 20,
      count: metrics?.negative_count ?? 250,
      color: SENTIMENT_COLORS.Negative,
    },
  ];

  const topicsList = [
    { name: 'checkout', count: 312, sentiment: 'Negative' },
    { name: 'payment', count: 284, sentiment: 'Negative' },
    { name: 'ui', count: 195, sentiment: 'Positive' },
    { name: 'crash', count: 168, sentiment: 'Negative' },
    { name: 'filters', count: 142, sentiment: 'Neutral' },
    { name: 'dark mode', count: 128, sentiment: 'Neutral' },
    { name: 'login', count: 110, sentiment: 'Negative' },
    { name: 'wallet', count: 96, sentiment: 'Positive' },
    { name: 'delivery', count: 75, sentiment: 'Neutral' },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-[#1a2338] pb-2 text-xs">
        {[
          { key: 'themes', label: 'Themes', icon: BarChart3 },
          { key: 'sentiment', label: 'Sentiment', icon: Smile },
          { key: 'topics', label: 'Topics', icon: Hash },
          { key: 'wordcloud', label: 'Word Cloud', icon: Cloud },
          { key: 'ai_insights', label: 'AI Insights', icon: Lightbulb },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#151d30]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Top Themes vs Sentiment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Top Themes (col-span-7) */}
        <div className="lg:col-span-7 bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 shadow-xl space-y-3">
          <div className="border-b border-[#1a2338] pb-2.5">
            <h3 className="text-xs font-semibold text-white">Top Themes</h3>
            <p className="text-[11px] text-slate-400">Aggregated cluster volume across customer feedback</p>
          </div>

          <div className="space-y-3 pt-1">
            {themesData.map((t) => (
              <div key={t.theme} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium text-[11px]">{t.theme}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{t.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-[#151d30] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-300"
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sentiment Distribution Donut (col-span-5) */}
        <div className="lg:col-span-5 bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 shadow-xl flex flex-col justify-between">
          <div className="border-b border-[#1a2338] pb-2.5">
            <h3 className="text-xs font-semibold text-white">Sentiment Distribution</h3>
            <p className="text-[11px] text-slate-400">Total customer sentiment proportion</p>
          </div>

          <div className="my-auto flex flex-col items-center">
            <div className="h-[170px] w-[170px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sentimentData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
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
                <span className="text-lg font-bold text-white tracking-tight leading-none">
                  {total.toLocaleString()}
                </span>
                <span className="text-[9.5px] text-slate-400 mt-0.5">Feedback</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-3 text-xs">
              {sentimentData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300 text-[11px]">{s.name}:</span>
                  <span className="font-bold text-white text-[11px]">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prominent AI Insight Callout Card */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-[#11192b] to-purple-950/50 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
              AI Insight
            </span>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              <strong>Checkout & Payments</strong> is the top friction issue (28%) and exhibits a high negative sentiment (47%). This is directly impacting ~8,500 monthly transactions. Consider prioritizing a dedicated checkout performance overhaul.
            </p>
          </div>
        </div>

        <button
          onClick={onViewThemeDetails}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-[#151d30] border border-indigo-500/30 hover:border-indigo-400 px-3 py-1.5 rounded-lg shrink-0 transition-colors cursor-pointer"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Topics / Word Cloud tab view */}
      {subTab === 'topics' && (
        <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-4 shadow-xl space-y-3">
          <h4 className="text-xs font-semibold text-white">Extracted Feedback Topics</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {topicsList.map((t) => (
              <div
                key={t.name}
                className="bg-[#151d30] border border-[#232f48] rounded-lg p-2.5 flex items-center justify-between"
              >
                <span className="font-mono text-indigo-300 text-[11px]">#{t.name}</span>
                <span className="text-[10px] text-slate-400">{t.count} mentions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'wordcloud' && (
        <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-6 shadow-xl text-center space-y-4">
          <h4 className="text-xs font-semibold text-white">Semantic Word Cloud</h4>
          <div className="flex flex-wrap items-center justify-center gap-4 py-6 max-w-lg mx-auto font-bold">
            <span className="text-2xl text-red-400">checkout</span>
            <span className="text-lg text-emerald-400">clean design</span>
            <span className="text-xl text-amber-400">payment</span>
            <span className="text-base text-sky-400">apple pay</span>
            <span className="text-2xl text-red-500">slow</span>
            <span className="text-sm text-slate-400">coupons</span>
            <span className="text-lg text-purple-400">dark mode</span>
            <span className="text-xl text-orange-400">crashes</span>
            <span className="text-base text-indigo-400">filters</span>
            <span className="text-xs text-slate-500">notifications</span>
          </div>
        </div>
      )}
    </div>
  );
}

