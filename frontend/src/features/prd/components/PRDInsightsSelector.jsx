import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function PRDInsightsSelector({
  contextPreview,
  selectedInsightIds = [],
  onToggleInsight,
  onSelectAll,
  onDeselectAll,
  onGeneratePRD,
  onGenerateSelected,
  isGenerating = false,
  projectsList = [],
}) {
  const [activeTab, setActiveTab] = useState('accepted'); // 'pending' | 'accepted' | 'generated'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const approvedIssues = contextPreview?.approved_issues || [];
  const pendingIssues = contextPreview?.pending_issues || [];

  const handleGenerate = onGeneratePRD || onGenerateSelected;

  // Map generated insight IDs from existing PRDs
  const generatedInsightIds = useMemo(() => {
    const ids = new Set();
    projectsList.forEach((p) => {
      (p.source_items?.issues || p.source_issue_ids || []).forEach((id) => ids.add(id));
    });
    return ids;
  }, [projectsList]);

  const items = useMemo(() => {
    if (activeTab === 'pending') return pendingIssues;
    if (activeTab === 'generated') {
      return approvedIssues.filter((i) => generatedInsightIds.has(i.issue_id || i.id));
    }
    return approvedIssues;
  }, [activeTab, approvedIssues, pendingIssues, generatedInsightIds]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const title = item.title || '';
      const id = item.issue_id || item.id || '';
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority =
        priorityFilter === 'all' ||
        (item.customer_impact || item.priority || 'HIGH').toLowerCase() === priorityFilter.toLowerCase();
      return matchesSearch && matchesPriority;
    });
  }, [items, searchQuery, priorityFilter]);

  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((i) => selectedInsightIds.includes(i.issue_id || i.id));

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-[#1e293b] space-y-3 bg-[#0d1424]/60">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">PM Accepted Insights</h2>
          <p className="text-[11px] text-slate-400">
            Select one or multiple PM-accepted insights to generate unified PRDs.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-[#223048]">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#1f293d] text-amber-300 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingIssues.length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'accepted'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PM Accepted ({approvedIssues.length})
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'generated'
                ? 'bg-emerald-600/80 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Generated ({projectsList.length})
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111827] border border-[#223048] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#111827] border border-[#223048] rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Insights List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-[#1e293b]/40">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-slate-600" />
            <p className="text-xs">No insights match the active filters.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemId = item.issue_id || item.id;
            const isSelected = selectedInsightIds.includes(itemId);
            const impact = (item.customer_impact || item.priority || 'HIGH').toUpperCase();
            const isAccepted = item.review_status === 'ACCEPTED' || activeTab === 'accepted';

            return (
              <div
                key={itemId}
                onClick={() => onToggleInsight && onToggleInsight(itemId)}
                className={`pt-2 p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'bg-violet-950/25 border-violet-500/50 shadow-sm'
                    : 'bg-[#111827]/60 border-transparent hover:border-[#223048] hover:bg-[#111827]'
                }`}
              >
                <div className="pt-0.5">
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-violet-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 hover:text-slate-400 shrink-0" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-violet-400">{itemId}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          impact === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300'
                            : impact === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {impact}
                      </span>
                      {isAccepted && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          Accepted
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-1">
                    {item.title}
                  </h3>

                  {item.problem_description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.problem_description}
                    </p>
                  )}

                  {item.evidence_record_ids && item.evidence_record_ids.length > 0 && (
                    <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-500">
                      <span>{item.evidence_record_ids.length} Evidence Records</span>
                      {item.frequency && <span>• {item.frequency} Reports</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Batch Generation Action */}
      <div className="p-4 border-t border-[#1e293b] bg-[#0d1424] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (allFilteredSelected) {
                if (onDeselectAll) onDeselectAll();
              } else {
                if (onSelectAll) onSelectAll(filteredItems.map((i) => i.issue_id || i.id));
              }
            }}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {allFilteredSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
            {selectedInsightIds.length} selected
          </span>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedInsightIds.length === 0}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
            isGenerating || selectedInsightIds.length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/25'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>
            {isGenerating
              ? 'Generating PRD...'
              : `Generate PRDs (${selectedInsightIds.length || 0})`}
          </span>
        </button>
      </div>
    </div>
  );
}
