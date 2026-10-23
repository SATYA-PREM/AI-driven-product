import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  MessageSquare,
  Compass,
  Code2,
  Search,
  Filter,
  Layers,
  X,
  FileText,
} from 'lucide-react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { prdAssignmentApi } from '../../api/prdAssignment';
import AssignmentDetailModal from './components/AssignmentDetailModal';

export default function RoleRequirementView({ viewType = 'ux' }) {
  const { workspaceId } = useParams();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPrd, setSelectedPrd] = useState('ALL');

  // Determine current view configuration from path or prop
  const path = location.pathname;
  let type = viewType;
  if (path.includes('ux-requirements')) type = 'ux';
  else if (path.includes('technical-requirements')) type = 'tech';
  else if (path.includes('acceptance-criteria')) type = 'acceptance';
  else if (path.includes('test-scenarios')) type = 'test';
  else if (path.includes('product-context')) type = 'context';
  else if (path.includes('customer-evidence')) type = 'evidence';

  const configs = {
    ux: {
      title: 'UX Requirements & Design Tasks',
      icon: Sparkles,
      iconColor: 'text-purple-400',
      description: 'Human-centered requirements, user journeys, interaction states, and accessibility specifications.',
      badge: 'Design Scope',
    },
    tech: {
      title: 'Technical Requirements & Architecture',
      icon: Code2,
      iconColor: 'text-blue-400',
      description: 'API contracts, schema dependencies, background jobs, latency thresholds, and engineering constraints.',
      badge: 'Engineering Scope',
    },
    acceptance: {
      title: 'Acceptance Criteria & Test Standards',
      icon: CheckSquare,
      iconColor: 'text-emerald-400',
      description: 'Definitive pass/fail criteria, edge cases, and verification bounds for release readiness.',
      badge: 'Quality Assurance',
    },
    test: {
      title: 'Test Scenarios & Expected Behaviors',
      icon: Shield,
      iconColor: 'text-amber-400',
      description: 'Behavioral permutations, regression checkpoints, error recovery flows, and QA test matrices.',
      badge: 'Testing Protocol',
    },
    context: {
      title: 'Product Context & Strategic Objectives',
      icon: Compass,
      iconColor: 'text-indigo-400',
      description: 'High-level business justification, user pain points, impact metrics, and value drivers.',
      badge: 'Product Strategy',
    },
    evidence: {
      title: 'Customer Evidence & Feedback Signals',
      icon: MessageSquare,
      iconColor: 'text-rose-400',
      description: 'Direct customer pain points, sentiment patterns, and feedback quotes supporting these requirements.',
      badge: 'Customer Evidence',
    },
  };

  const currentConfig = configs[type] || configs.ux;
  const IconComp = currentConfig.icon;

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    prdAssignmentApi.getMyAssignments(workspaceId)
      .then((res) => {
        setAssignments(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        console.warn('Error loading role requirements:', err);
      })
      .finally(() => setLoading(false));
  }, [workspaceId, type]);

  const handleOpenModal = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleSaved = (updated) => {
    setAssignments((prev) =>
      prev.map((item) =>
        item.assignment_id === updated.assignment_id ? { ...item, ...updated } : item
      )
    );
  };

  // Distinct PRDs list for dropdown
  const prdOptions = useMemo(() => {
    const map = new Map();
    assignments.forEach((item) => {
      const id = item.prd_id || item.prdId;
      const title = item.prd_title || item.prdTitle || id;
      if (id && !map.has(id)) {
        map.set(id, title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [assignments]);

  // Counts for tabs
  const statusCounts = useMemo(() => {
    return {
      ALL: assignments.length,
      ASSIGNED: assignments.filter((a) => (a.status || 'ASSIGNED').toUpperCase() === 'ASSIGNED').length,
      IN_PROGRESS: assignments.filter((a) => (a.status || '').toUpperCase() === 'IN_PROGRESS').length,
      COMPLETED: assignments.filter((a) => (a.status || '').toUpperCase() === 'COMPLETED').length,
      PENDING: assignments.filter((a) => !a.response).length,
      RESPONDED: assignments.filter((a) => !!a.response).length,
    };
  }, [assignments]);

  // Filtered requirements
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // PRD Filter
      if (selectedPrd !== 'ALL') {
        const itemPrdId = item.prd_id || item.prdId;
        if (itemPrdId !== selectedPrd) return false;
      }

      // Status Tab filter
      const itemStatus = (item.status || 'ASSIGNED').toUpperCase();
      if (statusFilter === 'ASSIGNED' && itemStatus !== 'ASSIGNED') return false;
      if (statusFilter === 'IN_PROGRESS' && itemStatus !== 'IN_PROGRESS') return false;
      if (statusFilter === 'COMPLETED' && itemStatus !== 'COMPLETED') return false;
      if (statusFilter === 'PENDING' && item.response) return false;
      if (statusFilter === 'RESPONDED' && !item.response) return false;

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (item.requirement_title || '').toLowerCase();
        const reqId = (item.requirement_id || '').toLowerCase();
        const prdTitle = (item.prd_title || '').toLowerCase();
        const desc = (item.requirement_description || '').toLowerCase();
        const problem = (item.problem_statement || '').toLowerCase();
        const impact = (item.customer_impact || '').toLowerCase();

        return (
          title.includes(q) ||
          reqId.includes(q) ||
          prdTitle.includes(q) ||
          desc.includes(q) ||
          problem.includes(q) ||
          impact.includes(q)
        );
      }

      return true;
    });
  }, [assignments, selectedPrd, statusFilter, searchQuery]);

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5b3df5]/15 border border-[#5b3df5]/30 flex items-center justify-center">
              <IconComp size={20} className={currentConfig.iconColor} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {currentConfig.title}
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
              {currentConfig.badge}
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            {currentConfig.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-lg">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ASSIGNED', label: 'Assigned' },
            { id: 'PENDING', label: 'Pending Response' },
            { id: 'RESPONDED', label: 'Responded' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            const count = statusCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and PRD Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* PRD Dropdown */}
          {prdOptions.length > 0 && (
            <div className="relative min-w-[160px] max-w-[240px]">
              <select
                value={selectedPrd}
                onChange={(e) => setSelectedPrd(e.target.value)}
                className="w-full bg-[#101428] border border-white/[0.08] text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-500/50 transition-colors cursor-pointer appearance-none truncate pr-8"
              >
                <option value="ALL">All PRDs ({prdOptions.length})</option>
                {prdOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))}
              </select>
              <Layers size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, REQ ID, keyword..."
              className="w-full bg-white/[0.04] border border-white/[0.08] text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-9 pr-8 py-2 outline-none focus:border-purple-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Requirement Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg">
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading requirements...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl space-y-2 shadow-lg">
          <CheckSquare size={36} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-300">
            {assignments.length === 0 ? 'No Assigned Requirements' : 'No Matching Requirements'}
          </p>
          <p className="text-slate-500 max-w-sm mx-auto">
            {assignments.length === 0
              ? 'There are no requirements assigned to your role in this workspace yet.'
              : 'Try clearing your search query or changing the status filter to see other requirements.'}
          </p>
          {assignments.length > 0 && (statusFilter !== 'ALL' || searchQuery || selectedPrd !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
                setSelectedPrd('ALL');
              }}
              className="mt-3 px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs hover:bg-purple-600/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Filter size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((item) => {
            return (
              <div
                key={item.assignment_id}
                className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl hover:border-purple-500/40 rounded-2xl p-5 space-y-4 transition-all shadow-lg"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.05] pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                      {item.requirement_id || 'REQ'}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {item.requirement_title || 'Requirement Title'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-purple-300 font-medium">
                      {item.prd_title || 'PRD'} ({item.prd_version || 'v1.0'})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/20">
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Specific view highlights */}
                {(type === 'ux' || type === 'context') && (
                  <div className="space-y-2 text-xs">
                    {item.problem_statement && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Problem Statement / User Context
                        </span>
                        <p className="text-slate-300 leading-relaxed">{item.problem_statement}</p>
                      </div>
                    )}
                    {item.customer_impact && (
                      <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block mb-1">
                          Customer Impact
                        </span>
                        <p className="text-slate-300 leading-relaxed">{item.customer_impact}</p>
                      </div>
                    )}
                  </div>
                )}

                {(type === 'tech' || type === 'ux') && item.requirement_description && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                      Technical & Functional Specification
                    </span>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{item.requirement_description}</p>
                  </div>
                )}

                {(type === 'acceptance' || type === 'test') && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Target Acceptance Criteria
                    </span>
                    {item.acceptance_criteria && item.acceptance_criteria.length > 0 ? (
                      <ul className="space-y-1.5 pl-1">
                        {item.acceptance_criteria.map((crit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-300">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{crit}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 italic">No specific acceptance criteria listed. Refer to PRD specs.</p>
                    )}
                  </div>
                )}

                {(type === 'evidence' || type === 'context') && item.supporting_insights && item.supporting_insights.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
                      Customer Feedback & Supporting Evidence
                    </span>
                    <ul className="space-y-1 pl-1">
                      {item.supporting_insights.map((ins, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-300">
                          <span className="text-rose-400 font-bold">✦</span>
                          <span>{ins}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    {item.response ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        Response Submitted
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1.5">
                        <Clock size={13} />
                        Pending Response
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenModal(item)}
                    className="px-4 py-1.5 rounded-xl bg-[#5b3df5]/15 hover:bg-[#5b3df5]/30 border border-[#5b3df5]/30 text-xs font-bold text-purple-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{item.response ? 'View / Edit Response' : 'Submit Response'}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Detail Modal */}
      <AssignmentDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={selectedAssignment}
        workspaceId={workspaceId}
        onSaved={handleSaved}
      />
    </div>
  );
}
