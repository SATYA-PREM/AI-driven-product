import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  ChevronDown,
  Search,
  Sparkles,
  UserPlus,
  Layers,
  FileText,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function PRDSelector({
  prds = [],
  selectedPrdIds = [],
  onSelectPrd,
  onSelectAll,
  onDeselectAll,
  onAutoAssign,
  onManualAssign,
  isAutoAssigning = false,
  totalRequirements = 0,
  assignedRequirements = 0,
  unassignedRequirements = 0,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrds = useMemo(() => {
    if (!searchQuery.trim()) return prds;
    const q = searchQuery.toLowerCase();
    return prds.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.prd_id || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }, [prds, searchQuery]);

  const allSelected = filteredPrds.length > 0 && filteredPrds.every((p) => selectedPrdIds.includes(p.prd_id));

  const getStatusBadge = (status) => {
    const s = String(status || 'DRAFT').toUpperCase();
    if (s === 'APPROVED' || s === 'LOCKED') {
      return <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">{s}</span>;
    }
    if (s === 'IN_REVIEW') {
      return <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold">{s}</span>;
    }
    return <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-bold">{s}</span>;
  };

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              PRD Team Handoff
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Role Specialization & Assignment
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Select PRD Requirements for Product Team Assignment
          </h2>
          <p className="text-xs text-slate-400">
            Assign granular functional requirements, UI/UX specs, and QA validation criteria to Product Designers, Developers, QA Testers, PMs, and Stakeholders.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onAutoAssign}
            disabled={selectedPrdIds.length === 0 || isAutoAssigning}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              selectedPrdIds.length === 0 || isAutoAssigning
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-violet-600/25'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isAutoAssigning ? 'animate-spin' : 'text-violet-200'}`} />
            <span>{isAutoAssigning ? 'Analyzing Assignments...' : 'Auto Assign (AI Specialist)'}</span>
          </button>

          <button
            onClick={onManualAssign}
            disabled={selectedPrdIds.length === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              selectedPrdIds.length === 0
                ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                : 'bg-[#111827] hover:bg-slate-800 text-slate-200 hover:text-white border-[#223048]'
            }`}
          >
            <UserPlus className="w-4 h-4 text-slate-400" />
            <span>Manual Assign</span>
          </button>
        </div>
      </div>

      {/* PRD Dropdown & Live Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Dropdown Selector */}
        <div className="lg:col-span-7 relative">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-[#111827] border border-[#223048] hover:border-slate-500 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-colors shadow-inner"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Target PRD Documents
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {selectedPrdIds.length === 0
                    ? 'Click to select PRDs from workspace...'
                    : selectedPrdIds.length === 1
                    ? prds.find((p) => p.prd_id === selectedPrdIds[0])?.title || selectedPrdIds[0]
                    : `${selectedPrdIds.length} PRDs Selected (${totalRequirements} Requirements)`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20">
                {selectedPrdIds.length} / {prds.length} Selected
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Expanded Dropdown Panel */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-[#0f172a] border border-[#223048] rounded-2xl shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Search and Bulk Selection Controls */}
              <div className="flex items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search PRD title, ID, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111827] border border-[#223048] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={allSelected ? onDeselectAll : onSelectAll}
                    className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 border border-[#223048] text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* PRD Options List */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredPrds.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No PRD documents found matching your filter.
                  </div>
                ) : (
                  filteredPrds.map((prd) => {
                    const isChecked = selectedPrdIds.includes(prd.prd_id);
                    return (
                      <div
                        key={prd.prd_id}
                        onClick={() => onSelectPrd(prd.prd_id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isChecked
                            ? 'bg-violet-600/10 border-violet-500/40 text-white'
                            : 'bg-[#111827]/80 hover:bg-[#111827] border-[#223048] text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className="text-violet-400 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPrd(prd.prd_id);
                            }}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-violet-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-violet-400">{prd.prd_id}</span>
                              <span className="text-xs font-bold text-slate-100 truncate">{prd.title || 'Untitled PRD'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>Cat: {prd.category || 'General'}</span>
                              <span>•</span>
                              <span>Ver: {prd.current_version || 'v1.0'}</span>
                              <span>•</span>
                              <span>{prd.features_count || prd.features?.length || 0} Features</span>
                              <span>•</span>
                              <span>{prd.requirements_count || prd.requirements?.length || 0} Reqs</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {getStatusBadge(prd.status)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Real-time Requirement Assignment Summary Cards */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#111827] border border-[#223048] rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Reqs</span>
            <span className="text-sm font-black text-white">{totalRequirements}</span>
          </div>

          <div className="bg-[#111827] border border-emerald-500/20 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Assigned</span>
            <span className="text-sm font-black text-emerald-300">{assignedRequirements}</span>
          </div>

          <div className="bg-[#111827] border border-amber-500/20 rounded-xl p-2.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Unassigned</span>
            <span className="text-sm font-black text-amber-300">{unassignedRequirements}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

