import React, { useState, useEffect } from 'react';
import {
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Users,
  Search,
  Filter,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';
import StakeholderFeedbackModal from './components/StakeholderFeedbackModal';

export default function MilestonesProgress() {
  const { workspaceId } = useParams();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback modal
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    async function loadMilestones() {
      if (!workspaceId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await stakeholderApi.listMilestones(workspaceId);
        setMilestones(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Failed to load milestones:', err);
        setError(err.message || 'Failed to fetch milestones');
      } finally {
        setLoading(false);
      }
    }
    loadMilestones();
  }, [workspaceId]);

  const handleOpenFeedback = (m) => {
    setSelectedMilestone(m);
    setIsFeedbackOpen(true);
  };

  const filteredMilestones = milestones.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.responsible_pm && m.responsible_pm.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Target size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Milestones & High-Level Progress</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Delivery Confidence
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Executive delivery milestones, progress percentages, target dates, and blocker visibility
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search milestones or responsible PM..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ON_TRACK', label: 'On Track' },
            { id: 'AT_RISK', label: 'At Risk' },
            { id: 'DELAYED', label: 'Delayed' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
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

      {/* Milestones Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredMilestones.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center text-xs text-slate-400">
            No milestones found matching your criteria.
          </div>
        ) : (
          filteredMilestones.map((m) => (
            <div
              key={m.milestone_id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-500/40 transition-all space-y-4 shadow-lg shadow-black/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {m.milestone_id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      m.status === 'ON_TRACK' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' :
                      m.status === 'AT_RISK' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {m.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock size={11} /> Target: <strong className="text-slate-200">{m.target_date}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{m.name}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenFeedback(m)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare size={13} />
                    <span>Feedback</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Overall Delivery Progress</span>
                  <span className="font-bold text-white">{m.progress_percentage}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      m.status === 'COMPLETED' ? 'bg-emerald-400' :
                      m.status === 'AT_RISK' ? 'bg-amber-400' :
                      m.status === 'DELAYED' ? 'bg-rose-400' :
                      'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, m.progress_percentage))}%` }}
                  />
                </div>
              </div>

              {/* Responsible PM, Dependencies & Blockers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/[0.06] text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Responsible PM</span>
                  <span className="text-slate-200 font-semibold">{m.responsible_pm || 'Lead PM'}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Key Dependencies</span>
                  {m.dependencies && m.dependencies.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {m.dependencies.map((dep, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {dep}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blockers / Concerns</span>
                  {m.blockers && m.blockers.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {m.blockers.map((b, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          {b}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-emerald-400">No active blockers</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedMilestone && (
        <StakeholderFeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          workspaceId={workspaceId}
          initialTargetType="INITIATIVE"
          initialTargetId={selectedMilestone.milestone_id}
          initialTargetTitle={selectedMilestone.name}
        />
      )}
    </div>
  );
}

