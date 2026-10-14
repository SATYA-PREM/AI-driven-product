import React, { useState, useEffect } from 'react';
import {
  Layers,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Users,
  Search,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';
import StakeholderFeedbackModal from './components/StakeholderFeedbackModal';

export default function RoadmapPortfolio() {
  const { workspaceId } = useParams();
  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'timeline', 'priority', 'objective'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Feedback modal
  const [selectedInit, setSelectedInit] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    async function loadPortfolio() {
      if (!workspaceId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await stakeholderApi.getRoadmapPortfolio(workspaceId);
        setInitiatives(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Failed to load roadmap portfolio:', err);
        setError(err.message || 'Failed to fetch roadmap portfolio');
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, [workspaceId]);

  const handleOpenFeedback = (init) => {
    setSelectedInit(init);
    setIsFeedbackOpen(true);
  };

  const filteredInitiatives = initiatives.filter((init) => {
    const matchesSearch =
      init.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      init.expected_outcome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (init.business_objective && init.business_objective.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'ALL' || init.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Product Roadmap & Portfolio</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Strategic Sequence
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Direction, sequence, expected outcomes, and dependencies across all active product initiatives
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          {[
            { id: 'list', label: 'Initiative List' },
            { id: 'timeline', label: 'Timeline View' },
            { id: 'priority', label: 'By Priority' },
            { id: 'objective', label: 'By Objective' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Non-Commitment Disclosure Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] flex items-center gap-2.5 text-xs text-slate-300">
        <Sparkles size={16} className="text-purple-400 shrink-0" />
        <div>
          <span className="font-semibold text-white">Directional Guidance Note: </span>
          Planned initiatives reflect strategic direction and sequence. Dates are subject to PM milestone sign-off and do not constitute committed delivery contracts.
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search initiatives, objectives, outcomes..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Main View Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredInitiatives.length === 0 ? (
        <div className="p-10 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center text-xs text-slate-400">
          No initiatives found matching the current criteria.
        </div>
      ) : activeTab === 'list' ? (
        /* Standard Detailed List View */
        <div className="space-y-4">
          {filteredInitiatives.map((init) => (
            <div
              key={init.initiative_id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-500/40 transition-all space-y-3 shadow-lg shadow-black/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {init.initiative_id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      init.priority === 'CRITICAL' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                      init.priority === 'HIGH' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                      'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    }`}>
                      {init.priority} PRIORITY
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {init.current_stage?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {init.approval_state}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{init.title}</h3>
                  <p className="text-xs text-slate-300">{init.expected_outcome}</p>
                </div>

                <div className="shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => handleOpenFeedback(init)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare size={13} />
                    <span>Business Feedback</span>
                  </button>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Business Objective</span>
                  <span className="font-semibold text-slate-200 truncate block">{init.business_objective || 'Core Alignment'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Planned Timeline</span>
                  <span className="text-slate-200 block">{init.planned_timeline}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Milestone</span>
                  <span className="text-slate-200 block truncate">{init.target_milestone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Responsible PM</span>
                  <span className="text-purple-300 block truncate">{init.responsible_pm}</span>
                </div>
              </div>

              {/* Dependencies & Risk */}
              {init.dependencies && init.dependencies.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-400">Dependencies:</span>
                  {init.dependencies.map((dep, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {dep}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : activeTab === 'timeline' ? (
        /* Timeline Sequencing View */
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-6">
          <div className="text-xs text-slate-400">Strategic delivery sequence over upcoming quarters:</div>
          <div className="relative border-l-2 border-purple-500/30 ml-4 space-y-6 pl-6">
            {filteredInitiatives.map((init) => (
              <div key={init.initiative_id} className="relative group">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-slate-900 shadow-sm shadow-purple-500/50" />
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{init.title}</span>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {init.planned_timeline}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{init.expected_outcome}</p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span>Milestone: <strong className="text-slate-300">{init.target_milestone}</strong></span>
                    <span>PM: <strong className="text-slate-300">{init.responsible_pm}</strong></span>
                    <button
                      onClick={() => handleOpenFeedback(init)}
                      className="text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      Give Feedback
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'priority' ? (
        /* Priority Grouping */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['CRITICAL', 'HIGH', 'MEDIUM'].map((prio) => {
            const group = filteredInitiatives.filter((i) => i.priority === prio);
            return (
              <div key={prio} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    prio === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                    prio === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {prio} PRIORITY
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{group.length}</span>
                </div>
                <div className="space-y-3">
                  {group.map((init) => (
                    <div key={init.initiative_id} className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] space-y-2">
                      <div className="text-xs font-bold text-white">{init.title}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{init.expected_outcome}</p>
                      <div className="text-[10px] text-slate-400 pt-1 flex justify-between items-center">
                        <span>{init.planned_timeline}</span>
                        <button
                          onClick={() => handleOpenFeedback(init)}
                          className="text-purple-400 hover:text-purple-300 font-semibold"
                        >
                          Feedback
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grouped by Objective */
        <div className="space-y-6">
          {Array.from(new Set(filteredInitiatives.map((i) => i.business_objective || 'General Alignment'))).map((objName) => {
            const group = filteredInitiatives.filter((i) => (i.business_objective || 'General Alignment') === objName);
            return (
              <div key={objName} className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-300">Objective:</span>
                  <h3 className="text-sm font-bold text-white">{objName}</h3>
                  <span className="text-xs text-slate-400">({group.length} initiatives)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.map((init) => (
                    <div key={init.initiative_id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{init.title}</span>
                        <span className="text-[10px] text-slate-400">{init.planned_timeline}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{init.expected_outcome}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedInit && (
        <StakeholderFeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          workspaceId={workspaceId}
          initialTargetType="INITIATIVE"
          initialTargetId={selectedInit.initiative_id}
          initialTargetTitle={selectedInit.title}
        />
      )}
    </div>
  );
}

