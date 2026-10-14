import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import QARequestClarificationModal from './components/QARequestClarificationModal';

export default function QAAssignedPRDs() {
  const { workspaceId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState('REQ-PAYMENT-RECOVERY');

  const fetchRequirements = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await qaApi.getRequirements(workspaceId);
      setData(res || null);
    } catch (err) {
      setError(err.message || 'Failed to load assigned PRDs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [workspaceId]);

  const handleClarify = (reqId) => {
    setSelectedReqId(reqId);
    setIsClarificationModalOpen(true);
  };

  const prd = data?.prd_overview || {};
  const reqs = data?.requirements || [];

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <FileText size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Assigned PRDs & Requirements
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              Read-Only
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Authoritative product requirement baselines approved by the Product Manager
          </p>
        </div>

        <button
          onClick={() => handleClarify(reqs[0]?.requirement_id || 'REQ-PAYMENT-RECOVERY')}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <HelpCircle size={14} />
          <span>Request PM Clarification</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading approved PRD documentation...
        </div>
      ) : (
        <div className="space-y-6">
          {/* PRD Baseline Header Card */}
          <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {prd.prd_id || 'PRD-001'}
                </span>
                <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                  APPROVED (Version {prd.version || 'v1.2'})
                </span>
              </div>
              <span className="text-xs text-slate-400">Approved by: <strong className="text-slate-200">{prd.approved_by}</strong></span>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">{prd.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px] block font-semibold">PROBLEM STATEMENT</span>
                  <p className="text-slate-200 mt-1">{prd.problem_statement}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px] block font-semibold">PRODUCT OBJECTIVE</span>
                  <p className="text-slate-200 mt-1">{prd.product_objective}</p>
                </div>
              </div>
            </div>

            {/* Constraints & Dependencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <span className="text-slate-400 text-[11px] block font-semibold mb-1">Architecture Dependencies:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(prd.dependencies || []).map((dep, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-white/[0.06]">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block font-semibold mb-1">Compliance & Constraints:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(prd.constraints || []).map((c, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-white/[0.06]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Requirements & Criteria Cards */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Functional & Technical Requirements ({reqs.length})
            </h3>

            {reqs.map((req) => (
              <div
                key={req.requirement_id}
                className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {req.requirement_id}
                    </span>
                    <h4 className="text-sm font-bold text-white">{req.title}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {req.type}
                    </span>
                  </div>

                  <button
                    onClick={() => handleClarify(req.requirement_id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <HelpCircle size={13} />
                    <span>Clarify with PM</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300">{req.description}</p>

                {/* Acceptance Criteria Breakdown */}
                {req.acceptance_criteria && req.acceptance_criteria.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      Authoritative Acceptance Criteria:
                    </span>
                    <div className="space-y-2">
                      {req.acceptance_criteria.map((ac) => {
                        const isVerified = ac.verification_status === 'VERIFIED';
                        const isFailed = ac.verification_status === 'FAILED';
                        return (
                          <div
                            key={ac.criterion_id}
                            className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-purple-400">{ac.criterion_id}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                isVerified
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : isFailed
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}>
                                {ac.verification_status || 'PENDING'}
                              </span>
                            </div>
                            <p className="text-slate-200 font-medium">{ac.description}</p>
                            <p className="text-slate-400 text-[11px]">
                              Expected: <span className="text-slate-300">{ac.expected_behavior}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      <QARequestClarificationModal
        isOpen={isClarificationModalOpen}
        onClose={() => setIsClarificationModalOpen(false)}
        workspaceId={workspaceId}
        requirementId={selectedReqId}
        onSuccess={() => fetchRequirements()}
      />
    </div>
  );
}

