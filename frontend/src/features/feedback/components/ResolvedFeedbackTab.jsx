import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, MoreVertical } from 'lucide-react';
import { StatusBadge, SourceBadge } from './FeedbackBadges';

export default function ResolvedFeedbackTab({
  feedbackList = [],
  onSelectFeedback,
}) {
  const [sourceFilter, setSourceFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const resolvedItems = useMemo(() => {
    return feedbackList
      .filter((f) => f.status === 'Resolved')
      .filter((f) => (sourceFilter === 'All' ? true : f.source === sourceFilter))
      .filter((f) => (categoryFilter === 'All' ? true : f.category === categoryFilter))
      .filter((f) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          f.text.toLowerCase().includes(q) ||
          f.feedback_id.toLowerCase().includes(q)
        );
      });
  }, [feedbackList, sourceFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved Archive</span>
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Sources</option>
            <option value="App Store">App Store</option>
            <option value="Play Store">Play Store</option>
            <option value="Support">Support</option>
            <option value="Survey">Survey</option>
            <option value="Social Media">Social Media</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Checkout & Payments">Checkout & Payments</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Performance & Speed">Performance & Speed</option>
            <option value="Product Features">Product Features</option>
            <option value="Account & Login">Account & Login</option>
          </select>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search resolved feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151d30] border border-[#232f48] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Resolved Feedback Table */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#11192b] text-slate-400 text-[10.5px] border-b border-[#1a2338]">
              <tr>
                <th className="px-3.5 py-2.5 font-medium w-20">ID</th>
                <th className="px-3 py-2.5 font-medium">Feedback</th>
                <th className="px-3 py-2.5 font-medium w-36">Source</th>
                <th className="px-3 py-2.5 font-medium w-32">Category</th>
                <th className="px-3 py-2.5 font-medium w-28">Status</th>
                <th className="px-3 py-2.5 font-medium w-28">Resolved On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2338]/60 text-[11px]">
              {resolvedItems.length > 0 ? (
                resolvedItems.map((item) => (
                  <tr
                    key={item.feedback_id}
                    onClick={() => onSelectFeedback(item)}
                    className="hover:bg-[#151d30]/70 cursor-pointer transition-colors group"
                  >
                    <td className="px-3.5 py-2.5 font-mono text-[10.5px] text-indigo-400 font-semibold group-hover:underline">
                      {item.feedback_id}
                    </td>
                    <td className="px-3 py-2.5 text-slate-200 pr-4 font-normal max-w-md truncate">
                      {item.text}
                    </td>
                    <td className="px-3 py-2.5">
                      <SourceBadge source={item.source} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      {item.category}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-3 py-2.5 text-emerald-400 text-[10px] font-mono">
                      {item.resolution_date || item.date_str}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500 text-xs">
                    No resolved feedback matching criteria.
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

