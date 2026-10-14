import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Link as LinkIcon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';
import StakeholderFeedbackModal from './components/StakeholderFeedbackModal';

export default function RisksDependencies() {
  const { workspaceId } = useParams();
  const [data, setData] = useState({ risks: [], dependencies: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('risks'); // 'risks', 'dependencies'
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await stakeholderApi.listRisksAndDependencies(workspaceId);
        setData({
          risks: Array.isArray(res?.risks) ? res.risks : [],
          dependencies: Array.isArray(res?.dependencies) ? res.dependencies : [],
        });
      } catch (err) {
        console.error('Failed to load risks and dependencies:', err);
        setError(err.message || 'Failed to fetch risks & dependencies');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [workspaceId]);

  const handleOpenFeedback = (item) => {
    setSelectedItem(item);
    setIsFeedbackOpen(true);
  };

  const filteredRisks = data.risks.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.business_impact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.mitigation_strategy && r.mitigation_strategy.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeverity = severityFilter === 'ALL' || r.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const filteredDependencies = data.dependencies.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.impacted_initiative.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.owner_team.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Risks & Dependencies</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Risk Governance
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Proactive identification of business risks, impact severities, mitigation plans, and cross-team dependencies
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('risks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'risks' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Business Risks ({data.risks.length})
          </button>
          <button
            onClick={() => setActiveTab('dependencies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'dependencies' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dependencies ({data.dependencies.length})
          </button>
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
            placeholder={activeTab === 'risks' ? "Search risks, impacts, mitigations..." : "Search dependencies, teams..."}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        {activeTab === 'risks' && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
            {[
              { id: 'ALL', label: 'All Severities' },
              { id: 'CRITICAL', label: 'Critical' },
              { id: 'HIGH', label: 'High' },
              { id: 'MEDIUM', label: 'Medium' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSeverityFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  severityFilter === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Content View */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : activeTab === 'risks' ? (
        /* Risks Tab */
        <div className="space-y-4">
          {filteredRisks.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center space-y-2">
              <ShieldCheck size={36} className="mx-auto text-emerald-400" />
              <div className="text-sm font-semibold text-white">No risks matching criteria</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No open business risks flagged at this severity level.
              </p>
            </div>
          ) : (
            filteredRisks.map((r) => (
              <div
                key={r.risk_id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-rose-500/40 transition-all space-y-3 shadow-lg shadow-black/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {r.risk_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        r.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        r.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {r.severity} SEVERITY
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {r.likelihood} LIKELIHOOD
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-purple-300">
                        STATUS: {r.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{r.title}</h3>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => handleOpenFeedback(r)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare size={13} />
                      <span>Feedback</span>
                    </button>
                  </div>
                </div>

                {/* Business Impact Block */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5 text-xs">
                  <span className="text-[10px] font-semibold text-rose-400 uppercase block">Expected Business Impact</span>
                  <p className="text-slate-300 leading-relaxed">{r.business_impact}</p>
                </div>

                {/* Mitigation Strategy */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5 text-xs">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase block">Mitigation Plan & Owner</span>
                  <p className="text-slate-300 leading-relaxed">{r.mitigation_strategy || 'Mitigation strategy under review by product leadership.'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Dependencies Tab */
        <div className="space-y-4">
          {filteredDependencies.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
              <div className="text-sm font-semibold text-white">No active dependencies found</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No cross-team or third-party dependencies currently impacting milestones.
              </p>
            </div>
          ) : (
            filteredDependencies.map((dep) => (
              <div
                key={dep.dependency_id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-slate-700 transition-all space-y-3 shadow-lg shadow-black/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {dep.dependency_id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {dep.criticality || 'STANDARD'} CRITICALITY
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                        {dep.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{dep.title}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Impacted Initiative</span>
                    <span className="text-slate-200 font-semibold">{dep.impacted_initiative}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Providing Team / Vendor</span>
                    <span className="text-purple-300 font-semibold">{dep.owner_team}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedItem && (
        <StakeholderFeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          workspaceId={workspaceId}
          initialTargetType="GENERAL"
          initialTargetId={selectedItem.risk_id || selectedItem.dependency_id}
          initialTargetTitle={selectedItem.title}
        />
      )}
    </div>
  );
}

