import React, { useState, useMemo } from 'react';
import { Search, UserCheck, Filter, MoreVertical } from 'lucide-react';
import { SentimentBadge, StatusBadge, PriorityBadge, SourceBadge } from './FeedbackBadges';

export default function MyFeedbackTab({
  feedbackList = [],
  onSelectFeedback,
}) {
  const [assigneeFilter, setAssigneeFilter] = useState('Me');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredList = useMemo(() => {
    return feedbackList.filter((item) => {
      if (assigneeFilter === 'Me' && item.assigned_to !== 'Me' && item.assigned_to !== 'user_pm') {
        return false;
      }
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== 'All' && item.priority !== priorityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.text.toLowerCase().includes(q) ||
          item.feedback_id.toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [feedbackList, assigneeFilter, statusFilter, priorityFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg text-xs text-indigo-300 font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assigned to Me</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
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

        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search my feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151d30] border border-[#232f48] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* My Feedback Table */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#11192b] text-slate-400 text-[10.5px] border-b border-[#1a2338]">
              <tr>
                <th className="px-3.5 py-2.5 font-medium w-20">ID</th>
                <th className="px-3 py-2.5 font-medium">Feedback</th>
                <th className="px-3 py-2.5 font-medium w-36">Source</th>
                <th className="px-3 py-2.5 font-medium w-28">Sentiment</th>
                <th className="px-3 py-2.5 font-medium w-28">Priority</th>
                <th className="px-3 py-2.5 font-medium w-28">Status</th>
                <th className="px-3 py-2.5 font-medium w-28">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2338]/60 text-[11px]">
              {filteredList.length > 0 ? (
                filteredList.map((item) => (
                  <tr
                    key={item.feedback_id}
                    onClick={() => onSelectFeedback(item)}
                    className="hover:bg-[#151d30]/70 cursor-pointer transition-colors"
                  >
                    <td className="px-3.5 py-2.5 font-mono text-[10.5px] text-indigo-400 font-semibold">
                      {item.feedback_id}
                    </td>
                    <td className="px-3 py-2.5 text-slate-200 pr-4 font-normal max-w-md truncate">
                      {item.text}
                    </td>
                    <td className="px-3 py-2.5">
                      <SourceBadge source={item.source} />
                    </td>
                    <td className="px-3 py-2.5">
                      <SentimentBadge sentiment={item.sentiment} />
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-500 text-xs">
                    No feedback assigned to you matching the criteria.
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

