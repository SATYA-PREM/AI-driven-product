import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Layers,
} from 'lucide-react';
import { formatLocalDate } from '../utils/formatDate';

export default function PRDGeneratedHistoryTable({
  projectsList = [],
  selectedPrdId = null,
  onSelectPRD,
  onViewPRD,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProjects = useMemo(() => {
    return projectsList.filter((p) => {
      const title = p.title || '';
      const id = p.prd_id || '';
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || (p.status || 'draft').toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [projectsList, searchQuery, statusFilter]);

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl select-none">
      {/* Table Header & Search Controls */}
      <div className="p-4 border-b border-[#1e293b] bg-[#0d1424]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Generated PRDs</h3>
          <p className="text-[11px] text-slate-400">
            All generated PRDs are automatically saved in MongoDB with versioning and traceability.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search PRDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111827] border border-[#223048] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 w-48 sm:w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111827] border border-[#223048] rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
          </select>

          <button
            onClick={() => {
              const dataStr = JSON.stringify(projectsList, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `prds_export_${Date.now()}.json`;
              a.click();
            }}
            className="px-3 py-1.5 rounded-xl bg-[#111827] border border-[#223048] hover:border-violet-500/50 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#090d16] text-[10px] uppercase font-bold text-slate-500 border-b border-[#1e293b]">
            <tr>
              <th className="py-3 px-4">PRD ID</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Source Insights</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Generated On</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No PRDs found in MongoDB for this batch.
                </td>
              </tr>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = p.prd_id === selectedPrdId;
                const status = p.status || 'draft';
                const sourceList = p.source_issue_ids || [];

                return (
                  <tr
                    key={p.prd_id}
                    onClick={() => {
                      if (onSelectPRD) onSelectPRD(p.prd_id);
                    }}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-violet-950/20 hover:bg-violet-950/30'
                        : 'hover:bg-[#111827]/80'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-violet-400">
                      {p.prd_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white max-w-xs truncate">
                      {p.title || 'Product Requirements Document'}
                    </td>
                    <td className="py-3 px-4">
                      {sourceList.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {sourceList.slice(0, 3).map((id, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700"
                            >
                              {id}
                            </span>
                          ))}
                          {sourceList.length > 3 && (
                            <span className="text-[10px] text-slate-500">
                              +{sourceList.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">Batch Collection</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        High
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {p.current_version || 'v1.0'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {formatLocalDate(p.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectPRD) onSelectPRD(p.prd_id);
                          if (onViewPRD) onViewPRD();
                        }}
                        className="p-1.5 rounded-lg bg-[#111827] hover:bg-violet-600 text-slate-300 hover:text-white border border-[#223048] transition-colors"
                        title="View Full PRD"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

