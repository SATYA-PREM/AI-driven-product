import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Layers,
  MessageSquare,
  Lock,
  Search
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';
import StakeholderFeedbackModal from './components/StakeholderFeedbackModal';

export default function BusinessObjectives() {
  const { workspaceId } = useParams();
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Feedback modal
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    async function loadObjectives() {
      if (!workspaceId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await stakeholderApi.listBusinessObjectives(workspaceId);
        setObjectives(Array.isArray(res) ? res : []);
        if (res && res.length > 0) {
          setExpandedId(res[0].objective_id);
        }
      } catch (err) {
        console.error('Failed to load business objectives:', err);
        setError(err.message || 'Failed to fetch business objectives');
      } finally {
        setLoading(false);
      }
    }
    loadObjectives();
  }, [workspaceId]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleOpenFeedback = (obj) => {
    setSelectedObjective(obj);
    setIsFeedbackOpen(true);
  };

  const filteredObjectives = objectives.filter((obj) => {
    const matchesSearch =
      obj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (obj.business_rationale && obj.business_rationale.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || obj.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Target size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Business Objectives</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Strategic Alignment
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Executive review of strategic objectives, customer problems, expected value, and delivery evidence
              </p>
            </div>
          </div>
        </div>

        {/* Read-Only Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
          <Lock size={13} className="text-amber-400" />
          <span>Governance: Stakeholder Review & Feedback</span>
        </div>
      </div>

      {/* Permission & Scope Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-center gap-3 text-xs text-slate-300">
        <Sparkles size={18} className="text-purple-400 shrink-0" />
        <div>
          <span className="font-semibold text-white">Strategic Governance Boundary: </span>
          Stakeholders review objectives and provide business feedback. Editing or approving an objective requires explicit authorization and does not modify PM execution priorities directly.
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
            placeholder="Search objectives, problems, rationale..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk</option>
            <option value="ACHIEVED">Achieved</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Objectives Accordion / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredObjectives.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center text-xs text-slate-400">
            No business objectives match your search or filter.
          </div>
        ) : (
          filteredObjectives.map((obj) => {
            const isExpanded = expandedId === obj.objective_id;
            return (
              <div
                key={obj.objective_id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg shadow-black/20 ${
                  isExpanded
                    ? 'bg-slate-900/80 border-purple-500/40 ring-1 ring-purple-500/20'
                    : 'bg-slate-900/50 border-white/[0.08] hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(obj.objective_id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {obj.objective_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        obj.status === 'ACHIEVED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                        obj.status === 'ACTIVE' || obj.status === 'ON_TRACK' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' :
                        'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {obj.status}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> Target: {obj.target_date}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Owner: <strong className="text-slate-300">{obj.owner}</strong>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{obj.title}</h3>
                    <p className="text-xs text-slate-300 line-clamp-1">{obj.description}</p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFeedback(obj);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare size={13} />
                      <span>Feedback</span>
                    </button>
                    <div className="p-1 rounded-lg text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-white/[0.06] space-y-5 animate-fade-in text-xs">
                    {/* Customer & Business Problem Addressed */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
                        <div className="font-bold text-slate-200">Customer or Business Problem</div>
                        <p className="text-slate-300 leading-relaxed">
                          {obj.customer_problem || 'Addresses core workflow inefficiency and governance compliance requirements.'}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
                        <div className="font-bold text-slate-200">Business Rationale & Expected Value</div>
                        <p className="text-slate-300 leading-relaxed">
                          {obj.business_rationale || 'Directly drives ARR expansion and client retention.'}
                        </p>
                      </div>
                    </div>

                    {/* Contributing Initiatives & Success Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Initiatives */}
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-blue-300">
                          <Layers size={14} />
                          <span>Associated Contributing Initiatives</span>
                        </div>
                        {obj.associated_initiatives && obj.associated_initiatives.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {obj.associated_initiatives.map((init, i) => (
                              <span key={i} className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[11px]">
                                {init}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400">None explicitly mapped.</p>
                        )}
                      </div>

                      {/* Success Metrics */}
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-emerald-300">
                          <TrendingUp size={14} />
                          <span>How Success is Measured</span>
                        </div>
                        {obj.success_metrics && obj.success_metrics.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1 text-slate-300">
                            {obj.success_metrics.map((metric, i) => (
                              <li key={i}>{metric}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400">Metrics pending telemetry definition.</p>
                        )}
                      </div>
                    </div>

                    {/* Current Evidence & Risks */}
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <ShieldAlert size={14} />
                        <span>Known Risks & Assumptions</span>
                      </div>
                      {obj.risks && obj.risks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {obj.risks.map((r, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400">No active risks currently flagged for this objective.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedObjective && (
        <StakeholderFeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          workspaceId={workspaceId}
          initialTargetType="OBJECTIVE"
          initialTargetId={selectedObjective.objective_id}
          initialTargetTitle={selectedObjective.title}
        />
      )}
    </div>
  );
}

