import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  Search,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export default function PRDTraceabilityViewer({ traceability = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrace = (traceability || []).filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.problem || '').toLowerCase().includes(term) ||
      (item.issue_id || '').toLowerCase().includes(term) ||
      (item.requirement_id || '').toLowerCase().includes(term) ||
      (item.feature_id || '').toLowerCase().includes(term) ||
      (item.story_id || '').toLowerCase().includes(term)
    );
  });

  if (!traceability || traceability.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              End-to-End Traceability Matrix
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-bold">
                {traceability.length} Mappings
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Audit lineage: Problem &rarr; Issue &rarr; Evidence &rarr; Requirement &rarr; Feature &rarr; User Story
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter traceability..."
            className="w-full bg-[#111827] border border-[#223048] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1e293b] text-slate-400 bg-[#0d1527]/50 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Problem Domain</th>
              <th className="py-2.5 px-3">Issue ID</th>
              <th className="py-2.5 px-3">Evidence</th>
              <th className="py-2.5 px-3">Requirement</th>
              <th className="py-2.5 px-3">Feature Module</th>
              <th className="py-2.5 px-3">User Story</th>
              <th className="py-2.5 px-3">Acceptance Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/60">
            {filteredTrace.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#111827]/70 transition-colors">
                <td className="py-3 px-3 text-white font-medium max-w-xs truncate">
                  {row.problem || 'Customer Friction'}
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[10px] font-bold">
                    {row.issue_id || 'ISSUE-001'}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono text-violet-400 text-[10px]">
                  {row.evidence_id || 'FB001'}
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[10px] font-bold">
                    {row.requirement_id || 'REQ-001'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px] font-bold">
                    {row.feature_id || 'FEAT-001'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[10px] font-bold">
                    {row.story_id || 'US-001'}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-300 max-w-xs truncate text-[11px]">
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    {row.acceptance_criteria || 'Verified'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

