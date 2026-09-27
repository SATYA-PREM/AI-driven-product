import React from 'react';
import { Layers, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export default function PRDTraceabilityTableView({ prdData, onOpenTraceModal }) {
  const doc = prdData?.document || {};
  const project = prdData?.project || {};
  const requirements = prdData?.requirements || [];
  const features = prdData?.features || [];
  const userStories = prdData?.user_stories || [];
  const traceability = prdData?.traceability || [];

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl select-none space-y-4 p-5">
      <div className="border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              End-to-End Traceability Matrix
            </h3>
            <p className="text-[11px] text-slate-400">
              Direct provenance chain from customer feedback evidence through requirements to engineering implementation.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#090d16] text-[10px] uppercase font-bold text-slate-500 border-b border-[#1e293b]">
            <tr>
              <th className="py-3 px-4">Document</th>
              <th className="py-3 px-4">Source Type</th>
              <th className="py-3 px-4">Source ID</th>
              <th className="py-3 px-4">Relationship</th>
              <th className="py-3 px-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            <tr className="hover:bg-[#111827]/80">
              <td className="py-3 px-4 font-mono font-bold text-violet-400">{project.prd_id || 'PRD-001'}</td>
              <td className="py-3 px-4 text-emerald-400 font-semibold">PM Review</td>
              <td className="py-3 px-4 font-mono text-slate-300">{project.source_review_id || 'REV-001'}</td>
              <td className="py-3 px-4">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  Generated From
                </span>
              </td>
              <td className="py-3 px-4 text-slate-400">Approved PM Review Package</td>
            </tr>

            {requirements.map((req, idx) => (
              <React.Fragment key={idx}>
                <tr className="hover:bg-[#111827]/80">
                  <td className="py-3 px-4 font-mono text-violet-300">{req.requirement_id}</td>
                  <td className="py-3 px-4 text-amber-400 font-semibold">Product Insight</td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {req.source_insights?.join(', ') || 'PI-001'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                      Based On
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 truncate max-w-xs">{req.title}</td>
                </tr>

                {req.source_evidence && req.source_evidence.length > 0 && (
                  <tr className="hover:bg-[#111827]/80 bg-[#070b13]/40">
                    <td className="py-3 px-4 font-mono text-slate-500 pl-8">↳ Evidence</td>
                    <td className="py-3 px-4 text-blue-400 font-semibold">Feedback Quote</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {req.source_evidence.join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">
                        Supported By
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">Customer feedback record validation</td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {features.map((feat, idx) => (
              <tr key={idx} className="hover:bg-[#111827]/80">
                <td className="py-3 px-4 font-mono text-violet-300">{feat.feature_id}</td>
                <td className="py-3 px-4 text-purple-400 font-semibold">Requirement</td>
                <td className="py-3 px-4 font-mono text-slate-300">
                  {feat.requirement_ids?.join(', ') || 'REQ-001'}
                </td>
                <td className="py-3 px-4">
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                    Implements
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300 truncate max-w-xs">{feat.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

