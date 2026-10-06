import React, { useState, useEffect } from 'react';
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

      {/* Main Requirement Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg">
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading requirements...</span>
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl space-y-2 shadow-lg">
          <CheckSquare size={36} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-300">No Assigned Requirements</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            There are no requirements assigned to your role in this workspace yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((item) => {
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
