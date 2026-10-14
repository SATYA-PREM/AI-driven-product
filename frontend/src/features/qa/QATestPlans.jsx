import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, Clock, AlertOctagon, ChevronRight, Layers, FileText } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import CreateTestPlanModal from './components/CreateTestPlanModal';

export default function QATestPlans() {
  const { workspaceId } = useParams();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPlans = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await qaApi.getTestPlans(workspaceId);
      setPlans(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load test plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [workspaceId]);

  const filtered = plans.filter((p) => {
    return statusFilter === 'ALL' || p.status === statusFilter;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Target size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Test Plans
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              Quality Strategies
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Define objectives, test environment, entry and exit criteria across release cycles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/workspace/${workspaceId}/qa/test-suites`}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Test Suites
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>New Test Plan</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08]">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All States</option>
            <option value="READY">Ready</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-mono">{filtered.length} Plans</span>
      </div>

      {/* Test Plans List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading test plans...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] text-center text-slate-400 text-xs space-y-2">
          <p>No test plans found for this filter.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-purple-400 underline font-semibold"
          >
            Create first test plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((plan) => (
            <div
              key={plan.plan_id}
              className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-purple-500/30 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {plan.plan_id}
                  </span>
                  <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {plan.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Scope: <strong className="text-slate-200">{plan.feature_scope}</strong></span>
                  <span>PRD: <strong className="text-purple-300">{plan.prd_version}</strong></span>
                </div>
              </div>

              {plan.description && (
                <p className="text-xs text-slate-300">{plan.description}</p>
              )}

              {/* Objectives & Gates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">TEST OBJECTIVES</span>
                  <p className="text-slate-300 mt-1 line-clamp-2">{plan.test_objectives}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">ENTRY CRITERIA</span>
                  <p className="text-slate-300 mt-1 line-clamp-2">{plan.entry_criteria}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">EXIT CRITERIA</span>
                  <p className="text-slate-300 mt-1 line-clamp-2">{plan.exit_criteria}</p>
                </div>
              </div>

              {/* Progress and Metadata Footer */}
              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span>Cases: <strong className="text-white">{plan.test_case_count || 0}</strong></span>
                  <span>Pass Rate: <strong className="text-emerald-400">{plan.pass_rate || 0}%</strong></span>
                  <span>Environment: <strong className="text-slate-200">{plan.test_environment}</strong></span>
                  <span>Owner: <strong className="text-slate-200">{plan.test_owner}</strong></span>
                </div>

                <Link
                  to={`/workspace/${workspaceId}/qa/test-cases`}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>View Test Cases</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateTestPlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspaceId}
        onSuccess={() => fetchPlans()}
      />
    </div>
  );
}

