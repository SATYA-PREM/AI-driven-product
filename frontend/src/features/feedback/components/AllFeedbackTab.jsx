import React, { useState } from 'react';
import {
  Search,
  Plus,
  Calendar,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { SentimentBadge, StatusBadge, SourceBadge } from './FeedbackBadges';

export default function AllFeedbackTab({
  feedbackList = [],
  totalCount = 0,
  loading = false,
  sourceFilter,
  setSourceFilter,
  sentimentFilter,
  setSentimentFilter,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onSelectFeedback,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleToggleRow = (id, e) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleToggleAll = () => {
    if (selectedIds.size === feedbackList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(feedbackList.map((f) => f.feedback_id)));
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedList = feedbackList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Search & Filter Action Bar */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Source Filter */}
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
            <option value="Manual">Manual</option>
          </select>

          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Snoozed">Snoozed</option>
          </select>

          {/* Date Range Pill */}
          <div className="flex items-center gap-1.5 bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-xs text-slate-300 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Jul 1, 2025 - Jul 31, 2025</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-1 max-w-sm justify-end">
          {/* Search Input */}
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151d30] border border-[#232f48] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* + Add Feedback Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Feedback</span>
          </button>
        </div>
      </div>

      {/* Main Feedback Table */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#11192b] text-slate-400 text-[10.5px] border-b border-[#1a2338]">
              <tr>
                <th className="w-10 px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === feedbackList.length}
                    onChange={handleToggleAll}
                    className="rounded bg-[#151d30] border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 font-medium w-20">ID</th>
                <th className="px-3 py-2.5 font-medium">Feedback</th>
                <th className="px-3 py-2.5 font-medium w-36">Source</th>
                <th className="px-3 py-2.5 font-medium w-28">Sentiment</th>
                <th className="px-3 py-2.5 font-medium w-28">Status</th>
                <th className="px-3 py-2.5 font-medium w-28">Date</th>
                <th className="px-3 py-2.5 font-medium w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2338]/60 text-[11px]">
              {paginatedList.length > 0 ? (
                paginatedList.map((item) => {
                  const isChecked = selectedIds.has(item.feedback_id);
                  return (
                    <tr
                      key={item.feedback_id}
                      onClick={() => onSelectFeedback(item)}
                      className={`hover:bg-[#151d30]/70 cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleRow(item.feedback_id, e)}
                          className="rounded bg-[#151d30] border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10.5px] text-indigo-400 font-semibold">
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
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 text-[10px] font-mono">
                        {item.date_str}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-400 hover:text-white" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectFeedback(item)}
                          className="p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View details"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-500 text-xs">
                    {loading ? 'Loading feedback...' : 'No feedback matching the selected filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-[#1a2338] text-[10.5px] text-slate-400 bg-[#0a0f1a] flex flex-wrap justify-between items-center gap-2">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount || feedbackList.length)} of{' '}
            {totalCount || feedbackList.length} feedback
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-[#151d30] hover:bg-[#1a2338] text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2.5 py-0.5 rounded font-medium cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-[#151d30] text-slate-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded bg-[#151d30] hover:bg-[#1a2338] text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#151d30] border border-[#232f48] px-2 py-0.5 rounded text-[10px] text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

