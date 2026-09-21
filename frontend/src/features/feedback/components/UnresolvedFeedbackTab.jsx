import React, { useState, useMemo } from 'react';
import { CheckCircle2, MoreVertical } from 'lucide-react';
import { PriorityBadge, StatusBadge, SourceBadge } from './FeedbackBadges';

export default function UnresolvedFeedbackTab({
  feedbackList = [],
  onSelectFeedback,
  onResolve,
}) {
  const [sourceFilter, setSourceFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Recent');

  const unresolvedItems = useMemo(() => {
    return feedbackList
      .filter((f) => f.status === 'New' || f.status === 'In Review')
      .filter((f) => (sourceFilter === 'All' ? true : f.source === sourceFilter))
      .filter((f) => (priorityFilter === 'All' ? true : f.priority === priorityFilter));
  }, [feedbackList, sourceFilter, priorityFilter]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5">
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
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Recent">Recent</option>
            <option value="Priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Unresolved Feedback Table */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#11192b] text-slate-400 text-[10.5px] border-b border-[#1a2338]">
              <tr>
                <th className="px-3.5 py-2.5 font-medium w-20">ID</th>
                <th className="px-3 py-2.5 font-medium">Feedback</th>
                <th className="px-3 py-2.5 font-medium w-36">Source</th>
                <th className="px-3 py-2.5 font-medium w-28">Priority</th>
                <th className="px-3 py-2.5 font-medium w-28">Status</th>
                <th className="px-3 py-2.5 font-medium w-28">Date</th>
                <th className="px-3 py-2.5 font-medium w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2338]/60 text-[11px]">
              {unresolvedItems.length > 0 ? (
                unresolvedItems.map((item) => (
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
                    <td className="px-3 py-2.5">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-[10px] font-mono">
                      {item.date_str}
                    </td>
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onResolve(item.feedback_id)}
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/30 transition-colors cursor-pointer"
                        title="Mark as Resolved"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolve</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-500 text-xs">
                    All caught up! No unresolved feedback matching the filters.
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

