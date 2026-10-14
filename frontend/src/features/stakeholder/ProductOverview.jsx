import React, { useState, useEffect } from 'react';
import {
  Compass,
  Target,
  Users,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Award
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';
import StakeholderFeedbackModal from './components/StakeholderFeedbackModal';

export default function ProductOverview() {
  const { workspaceId } = useParams();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await stakeholderApi.getProductOverview(workspaceId);
        setOverview(res);
      } catch (err) {
        console.error('Failed to load product overview:', err);
        setError(err.message || 'Failed to fetch product overview');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
        Failed to load product overview: {error || 'No overview data found.'}
      </div>
    );
  }

  const { identity, status_summary, objectives, traceability_links } = overview;

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Compass size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Product Overview</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Read-Only Governance
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Strategic direction, customer problems, executive traceability, and governance posture
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Sparkles size={14} />
            <span>Provide Strategic Feedback</span>
          </button>
        </div>
      </div>

      {/* Product Identity Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] shadow-xl shadow-black/20 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {identity?.lifecycle_stage?.replace(/_/g, ' ') || 'ACTIVE'}
              </span>
              <h2 className="text-xl font-bold text-white">{identity?.name}</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{identity?.description}</p>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 min-w-[200px] p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Business Owner</span>
              <span className="font-semibold text-slate-200">{identity?.business_owner || 'Executive Leadership'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lead Product Manager</span>
              <span className="font-semibold text-purple-300">{identity?.product_manager || 'Lead PM'}</span>
            </div>
          </div>
        </div>

        {/* Vision & Target Customers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <Award size={15} />
              <span>Product Vision</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{identity?.vision || 'Empowering cross-functional teams with AI-driven product orchestration.'}"
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <Users size={15} />
              <span>Target Customers & Stakeholders</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {identity?.target_customers?.length ? (
                identity.target_customers.map((c, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Enterprise product teams & business sponsors</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Objectives Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-purple-400" />
            <h3 className="text-base font-bold text-white">Strategic Business Objectives</h3>
          </div>
          <Link
            to={`/workspace/${workspaceId}/stakeholder/business-objectives`}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
          >
            <span>Manage Objectives</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {objectives && objectives.length > 0 ? (
            objectives.map((obj) => (
              <div
                key={obj.objective_id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg shadow-black/20"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {obj.objective_id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {obj.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-snug">{obj.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{obj.description}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Owner: {obj.owner}</span>
                    <span>Target: {obj.target_date}</span>
                  </div>
                  {obj.success_metrics && obj.success_metrics.length > 0 && (
                    <div className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 truncate">
                      KPI: {obj.success_metrics[0]}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-8 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center text-xs text-slate-400">
              No formal strategic objectives registered.
            </div>
          )}
        </div>
      </div>

      {/* Status Summary & Traceability Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Summary */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Current Delivery & Decision Status</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Major Initiatives</span>
              <span className="text-lg font-bold text-white">{status_summary?.major_initiatives_count ?? 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Key Milestones</span>
              <span className="text-lg font-bold text-white">{status_summary?.key_milestones_count ?? 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Risks</span>
              <span className="text-lg font-bold text-rose-300">{status_summary?.significant_risks_count ?? 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Awaiting Decisions</span>
              <span className="text-lg font-bold text-amber-300">{status_summary?.decisions_awaiting_input ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Traceability Directory */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Executive Traceability Links</h3>
          </div>

          <div className="space-y-2 text-xs">
            <Link
              to={`/workspace/${workspaceId}/stakeholder/prd-review`}
              className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={15} className="text-purple-400" />
                <span className="font-semibold text-slate-200">Approved PRDs & Proposals</span>
              </div>
              <ArrowRight size={13} className="text-slate-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to={`/workspace/${workspaceId}/stakeholder/roadmap`}
              className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Layers size={15} className="text-blue-400" />
                <span className="font-semibold text-slate-200">Roadmap Initiatives & Milestones</span>
              </div>
              <ArrowRight size={13} className="text-slate-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to={`/workspace/${workspaceId}/stakeholder/metrics`}
              className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp size={15} className="text-emerald-400" />
                <span className="font-semibold text-slate-200">Configured Business Success Metrics</span>
              </div>
              <ArrowRight size={13} className="text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      <StakeholderFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        workspaceId={workspaceId}
        initialTargetType="GENERAL"
      />
    </div>
  );
}

