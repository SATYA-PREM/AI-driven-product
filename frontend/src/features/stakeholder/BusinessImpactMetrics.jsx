import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Award,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  BarChart3,
  Layers,
  Search,
  Filter,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';

export default function BusinessImpactMetrics() {
  const { workspaceId } = useParams();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadMetrics() {
      if (!workspaceId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await stakeholderApi.listBusinessMetrics(workspaceId);
        setMetrics(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Failed to load business metrics:', err);
        setError(err.message || 'Failed to fetch business metrics');
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [workspaceId]);

  const filteredMetrics = metrics.filter((m) => {
    const matchesSearch =
      m.metric_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.verification_source && m.verification_source.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Business Impact & Success Metrics</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Outcome Verification
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verifiable business KPIs, baseline benchmarks, outcome measurements, and verification sources
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grounded Data Policy Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] flex items-center gap-2.5 text-xs text-slate-300">
        <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
        <div>
          <span className="font-semibold text-white">Grounded Measurement Policy: </span>
          All outcome metrics distinguish actual measured results from targets or models. If a metric has not been linked to telemetry or source reporting, it is displayed as "Not configured" rather than simulated.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search metric name, category, source..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          {[
            { id: 'ALL', label: 'All Categories' },
            { id: 'FINANCIAL', label: 'Financial' },
            { id: 'CUSTOMER_ADOPTION', label: 'Adoption' },
            { id: 'OPERATIONAL_EFFICIENCY', label: 'Efficiency' },
            { id: 'GOVERNANCE', label: 'Governance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredMetrics.length === 0 ? (
          <div className="col-span-full p-12 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center space-y-3">
            <TrendingUp size={40} className="mx-auto text-slate-500" />
            <div className="text-sm font-semibold text-white">Not configured</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No business outcome metrics have been linked to this workspace yet. When the PM connects telemetry or targets, measured KPIs will appear here.
            </p>
          </div>
        ) : (
          filteredMetrics.map((m) => {
            const isMeasured = m.metric_type === 'MEASURED';
            return (
              <div
                key={m.metric_id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg shadow-black/20"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {m.metric_id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isMeasured
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {isMeasured ? 'VERIFIED MEASUREMENT' : 'TARGET / MODEL'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{m.metric_name}</h3>
                  <div className="text-[11px] text-slate-400">
                    Category: <strong className="text-slate-300">{m.category?.replace(/_/g, ' ')}</strong>
                  </div>
                </div>

                {/* Values Comparison: Baseline vs Current vs Target */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Current Value</span>
                    <div className="text-xl font-bold text-emerald-300">
                      {m.current_value !== null ? m.current_value : <span className="text-xs text-slate-500 italic">Not measured</span>}
                      {m.unit && <span className="text-xs text-slate-400 ml-1">{m.unit}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div>
                      <span className="block text-[10px] uppercase font-semibold">Baseline</span>
                      <span className="text-slate-300 font-medium">
                        {m.baseline_value !== null ? `${m.baseline_value} ${m.unit || ''}` : 'None'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-semibold">Target</span>
                      <span className="text-purple-300 font-bold">
                        {m.target_value !== null ? `${m.target_value} ${m.unit || ''}` : 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Source & Confidence */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">Source: <strong className="text-slate-300">{m.verification_source || 'Platform Analytics'}</strong></span>
                  {m.confidence && (
                    <span className="text-[10px] font-mono text-emerald-400">{m.confidence} Confidence</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

