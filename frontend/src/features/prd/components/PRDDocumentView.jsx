import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Target,
  Users,
  Layers,
  ShieldAlert,
  Clock,
  ChevronRight,
  List,
  Check,
  Zap,
  Activity,
  ShieldCheck,
  Tag,
  Quote,
} from 'lucide-react';
import { formatLocalDate } from '../utils/formatDate';

const SECTIONS = [
  { id: 'summary', num: '01', title: 'Executive Summary' },
  { id: 'problem', num: '02', title: 'Problem Definition & Breakdown' },
  { id: 'needs', num: '03', title: 'Customer Needs' },
  { id: 'business', num: '04', title: 'Business Context & Goals' },
  { id: 'objectives', num: '05', title: 'Target Users & Personas' },
  { id: 'scope', num: '06', title: 'Scope (In & Out of Scope)' },
  { id: 'solution', num: '07', title: 'Proposed Solution Architecture' },
  { id: 'requirements', num: '08', title: 'Functional Requirements' },
  { id: 'nfrs', num: '09', title: 'Non-Functional Requirements' },
  { id: 'stories', num: '10', title: 'User Stories & Criteria' },
  { id: 'features', num: '11', title: 'Features & Modules' },
  { id: 'metrics', num: '12', title: 'Success Metrics & KPIs' },
  { id: 'risks', num: '13', title: 'Risks & Mitigations' },
  { id: 'traceability', num: '14', title: 'Traceability & Verification' },
];

export default function PRDDocumentView({
  prdData,
  onSavePRD,
  onRegeneratePRD,
  isSaving = false,
  isRegenerating = false,
  onGoToGenerator,
}) {
  const doc = prdData?.document || {};
  const project = prdData?.project || {};
  const context = prdData?.context || {};

  const [activeSubtab, setActiveSubtab] = useState('Document');
  const [activeSectionId, setActiveSectionId] = useState('summary');
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [title, setTitle] = useState(doc.title || project.title || 'Product Requirements Document');
  const [problemStatement, setProblemStatement] = useState(
    typeof doc.problem_statement === 'object'
      ? doc.problem_statement?.primary_problem || ''
      : doc.problem_statement || ''
  );
  const [background, setBackground] = useState(doc.background || doc.executive_summary || '');
  const [customerNeed, setCustomerNeed] = useState(
    doc.customer_need || doc.problem_statement?.customer_need || ''
  );
  const [businessObjective, setBusinessObjective] = useState(
    doc.business_objective || (Array.isArray(doc.objectives) ? doc.objectives.join(' ') : doc.objectives) || ''
  );
  const [proposedSolution, setProposedSolution] = useState(doc.proposed_solution || '');

  useEffect(() => {
    if (doc) {
      setTitle(doc.title || project.title || 'Product Requirements Document');
      setProblemStatement(
        typeof doc.problem_statement === 'object'
          ? doc.problem_statement?.primary_problem || ''
          : doc.problem_statement || ''
      );
      setBackground(doc.background || doc.executive_summary || '');
      setCustomerNeed(doc.customer_need || doc.problem_statement?.customer_need || '');
      setBusinessObjective(
        doc.business_objective || (Array.isArray(doc.objectives) ? doc.objectives.join(' ') : doc.objectives) || ''
      );
      setProposedSolution(doc.proposed_solution || '');
    }
  }, [prdData]);

  if (!prdData || !prdData.project) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <FileText className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-white">No PRD Document Generated Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            There is no Product Requirements Document generated for this dataset batch yet. Select your approved insights on the left and click "Generate PRDs".
          </p>
        </div>
        {onGoToGenerator && (
          <button
            onClick={onGoToGenerator}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Go to PRD Generator
          </button>
        )}
      </div>
    );
  }

  const handleSave = () => {
    onSavePRD({
      title,
      problem_statement: problemStatement,
      background,
      customer_need: customerNeed,
      business_objective: businessObjective,
      proposed_solution: proposedSolution,
    });
    setIsEditing(false);
  };

  const status = project.status || 'draft';
  const createdDateStr = formatLocalDate(project.created_at || doc.created_at);

  const requirements = prdData.requirements || [];
  const features = prdData.features || [];
  const userStories = prdData.user_stories || [];
  const targetUsers = doc.target_users || ['Enterprise Product Managers', 'Software Engineers', 'End Users'];
  const inScope = doc.scope?.in_scope || [];
  const outOfScope = doc.scope?.out_of_scope || [];
  const successMetrics = doc.success_metrics || [];
  const constraints = doc.constraints || [];
  const assumptions = doc.assumptions || [];
  const dependencies = doc.dependencies || [];
  const risks = doc.risks || [];

  // Extract itemized problems from doc or fallback to approved context items
  const itemizedProblems =
    (typeof doc.problem_statement === 'object' && doc.problem_statement?.itemized_problems?.length > 0)
      ? doc.problem_statement.itemized_problems
      : [
          ...(context.approved_issues || []).map((i) => ({
            id: i.issue_id || i.id,
            title: i.title,
            description: i.problem_description || i.description,
            symptoms: i.symptoms || [`Friction observed in ${i.title}`],
            root_cause: i.root_cause || `Operational bottleneck in ${i.title}`,
            impact: i.customer_impact || 'high',
            evidence_count: (i.evidence_record_ids || []).length || 1,
            customer_need: i.recommended_action || `Streamline ${i.title} workflow.`,
          })),
          ...(context.approved_opportunities || []).map((o) => ({
            id: o.opportunity_id || o.id,
            title: o.title,
            description: o.description,
            symptoms: ['Feature opportunity requested by users'],
            root_cause: 'Capability not yet available in workspace',
            impact: o.priority || 'medium',
            evidence_count: (o.evidence_record_ids || []).length || 1,
            customer_need: `Implement ${o.title}.`,
          })),
        ];

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full select-none">
      {/* 1. Header Toolbar */}
      <div className="p-4 border-b border-[#1e293b] bg-[#0d1424]/80 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-violet-400">{project.prd_id}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
              Version {project.current_version || doc.version || 'v1.0'}
            </span>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                status === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              }`}
            >
              {status.replace('_', ' ')}
            </span>
            {itemizedProblems.length > 0 && (
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                {itemizedProblems.length} Approved Items Synthesized
              </span>
            )}
          </div>

          <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>

          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Generated: {createdDateStr}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">Generated by: {doc.generated_by || 'crewai-gemini'}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onRegeneratePRD && (
            <button
              onClick={onRegeneratePRD}
              disabled={isRegenerating}
              className="px-3 py-1.5 rounded-xl bg-[#111827] border border-[#223048] hover:border-violet-500/50 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
            </button>
          )}

          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-xl bg-[#111827] border border-[#223048] hover:border-violet-500/50 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-violet-400" />
              <span>Edit Document</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Subtabs Navigation */}
      <div className="flex items-center gap-2 px-4 border-b border-[#1e293b] bg-[#090d16] overflow-x-auto">
        {['Document', 'Requirements', 'User Stories', 'NFRs', 'Features', 'Metrics', 'Risks'].map((subtab) => (
          <button
            key={subtab}
            onClick={() => setActiveSubtab(subtab)}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeSubtab === subtab
                ? 'border-violet-500 text-violet-300 bg-violet-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {subtab}
            {subtab === 'Requirements' && ` (${requirements.length})`}
            {subtab === 'User Stories' && ` (${userStories.length})`}
            {subtab === 'Features' && ` (${features.length})`}
          </button>
        ))}
      </div>

      {/* 3. Main Split Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Table of Contents (Only in Document Subtab) */}
        {activeSubtab === 'Document' && (
          <div className="w-64 border-r border-[#1e293b] bg-[#070b13] p-3 space-y-1 overflow-y-auto hidden lg:block shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 py-1 block">
              PRD Sections ({SECTIONS.length})
            </span>
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSectionId(sec.id);
                  const el = document.getElementById(`section-${sec.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeSectionId === sec.id
                    ? 'bg-violet-600/20 text-violet-200 border border-violet-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111827]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] font-mono text-slate-500">{sec.num}</span>
                  <span className="truncate">{sec.title}</span>
                </div>
                {activeSectionId === sec.id && <ChevronRight className="w-3 h-3 text-violet-400" />}
              </button>
            ))}
          </div>
        )}

        {/* Right Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeSubtab === 'Document' && (
            <div className="space-y-6 max-w-4xl">
              {/* 1. Executive Summary */}
              <div id="section-summary" className="space-y-2">
                <div className="flex items-center gap-2 text-violet-400">
                  <span className="font-mono text-xs font-bold">1.</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Executive Summary
                  </h3>
                </div>
                {isEditing ? (
                  <textarea
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    rows={4}
                    className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
                  />
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed bg-[#111827] border border-[#223048] p-4 rounded-xl">
                    {background || 'This PRD establishes the roadmap to resolve customer friction.'}
                  </div>
                )}
              </div>

              {/* 2. Problem Definition & Multi-Item Breakdown */}
              <div id="section-problem" className="space-y-3">
                <div className="flex items-center justify-between text-violet-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">2.</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Problem Definition & Breakdown ({itemizedProblems.length} Items)
                    </h3>
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    rows={4}
                    className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
                  />
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed bg-[#111827] border border-[#223048] p-4 rounded-xl space-y-2">
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Synthesized Primary Problem:</span>
                    </div>
                    <p className="text-slate-300">{problemStatement || 'Operational bottlenecks identified across feedback collection.'}</p>
                  </div>
                )}

                {/* Itemized Problem Cards (Addresses all approved items) */}
                {itemizedProblems.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Approved Friction Points & Feature Opportunities ({itemizedProblems.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {itemizedProblems.map((prob, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-[#0f172a] border border-[#1e293b] rounded-xl space-y-2 hover:border-violet-500/40 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-violet-400">
                              {prob.id || `PI-${idx + 1}`}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                prob.impact === 'high'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {prob.impact || 'High'} Impact
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white">{prob.title}</h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{prob.description}</p>

                          {prob.root_cause && (
                            <div className="text-[11px] text-slate-400 bg-[#070b13] p-2 rounded-lg border border-[#1e293b]/60">
                              <span className="text-amber-400 font-semibold">Root Cause: </span>
                              {prob.root_cause}
                            </div>
                          )}

                          {prob.customer_need && (
                            <div className="text-[11px] text-slate-400 bg-[#070b13] p-2 rounded-lg border border-[#1e293b]/60">
                              <span className="text-emerald-400 font-semibold">Customer Need: </span>
                              {prob.customer_need}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Customer Needs */}
              <div id="section-needs" className="space-y-2">
                <div className="flex items-center gap-2 text-violet-400">
                  <span className="font-mono text-xs font-bold">3.</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Customer Needs
                  </h3>
                </div>
                {isEditing ? (
                  <textarea
                    value={customerNeed}
                    onChange={(e) => setCustomerNeed(e.target.value)}
                    rows={3}
                    className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
                  />
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed bg-[#111827] border border-[#223048] p-4 rounded-xl">
                    {customerNeed || 'Users require a reliable, automated mechanism to perform reporting and data operations.'}
                  </div>
                )}
              </div>

              {/* 4. Business Objectives */}
              <div id="section-business" className="space-y-2">
                <div className="flex items-center gap-2 text-violet-400">
                  <span className="font-mono text-xs font-bold">4.</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Business Objectives & Goals
                  </h3>
                </div>
                {isEditing ? (
                  <textarea
                    value={businessObjective}
                    onChange={(e) => setBusinessObjective(e.target.value)}
                    rows={3}
                    className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
                  />
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed bg-[#111827] border border-[#223048] p-4 rounded-xl">
                    {businessObjective || 'Eliminate operational bottlenecks and improve customer satisfaction and retention.'}
                  </div>
                )}
              </div>

              {/* 5. Target Users */}
              <div id="section-objectives" className="space-y-2">
                <div className="flex items-center gap-2 text-violet-400">
                  <span className="font-mono text-xs font-bold">5.</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Target Users & Personas
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {targetUsers.map((user, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#111827] border border-[#223048] rounded-xl flex items-center gap-2.5 text-xs text-slate-200"
                    >
                      <Users className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="font-semibold">{typeof user === 'string' ? user : user.role || 'User Persona'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Scope Boundaries */}
              <div id="section-scope" className="space-y-2">
                <div className="flex items-center gap-2 text-violet-400">
                  <span className="font-mono text-xs font-bold">6.</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Scope Boundaries
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#111827] border border-emerald-500/20 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> In Scope
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {inScope.length > 0 ? (
                        inScope.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Automated Workflow Friction Remediation</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="p-4 bg-[#111827] border border-rose-500/20 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-rose-400 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Out of Scope
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-400">
                      {outOfScope.length > 0 ? (
                        outOfScope.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-400 font-bold shrink-0">✕</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold shrink-0">✕</span>
                          <span>Third-party legacy tool migration and custom drivers</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 7. Proposed Solution */}
              <div id="section-solution" className="space-y-2">
                <div className="flex items-center gap-2 text-violet-400">
                  <span className="font-mono text-xs font-bold">7.</span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Proposed Solution Architecture
                  </h3>
                </div>
                {isEditing ? (
                  <textarea
                    value={proposedSolution}
                    onChange={(e) => setProposedSolution(e.target.value)}
                    rows={3}
                    className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
                  />
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed bg-[#111827] border border-[#223048] p-4 rounded-xl">
                    {proposedSolution || 'Deploy modular, permission-aware workflow enhancements with end-to-end telemetry and automated validation.'}
                  </div>
                )}
              </div>

              {/* 8. Functional Requirements Quick Preview */}
              <div id="section-requirements" className="space-y-3">
                <div className="flex items-center justify-between text-violet-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">8.</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Functional Requirements ({requirements.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveSubtab('Requirements')}
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300 underline cursor-pointer"
                  >
                    View All Details →
                  </button>
                </div>
                <div className="space-y-3">
                  {requirements.slice(0, 4).map((req, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#111827] border border-[#223048] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-violet-400">
                            {req.requirement_id || `REQ-${idx + 1}`}
                          </span>
                          <h4 className="text-xs font-bold text-white">{req.title}</h4>
                        </div>
                        <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                          {req.priority || 'High'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{req.description}</p>
                      {req.acceptance_criteria && req.acceptance_criteria.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Sample Acceptance Criteria:
                          </span>
                          <ul className="space-y-1 text-xs text-slate-300">
                            {req.acceptance_criteria.slice(0, 2).map((crit, cIdx) => (
                              <li key={cIdx} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{crit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Requirements Subtab */}
          {activeSubtab === 'Requirements' && (
            <div className="space-y-4 max-w-4xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Functional Requirements ({requirements.length})
                </h3>
              </div>
              <div className="space-y-3">
                {requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#111827] border border-[#223048] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-violet-400">
                          {req.requirement_id || `REQ-${idx + 1}`}
                        </span>
                        <h4 className="text-xs font-bold text-white">{req.title}</h4>
                      </div>
                      <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                        {req.priority || 'High'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{req.description}</p>

                    {/* Source Insight Tags */}
                    {((req.source_insights && req.source_insights.length > 0) || (req.source_opportunities && req.source_opportunities.length > 0)) && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Sources:</span>
                        {(req.source_insights || []).map((src, sIdx) => (
                          <span key={sIdx} className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                            {src}
                          </span>
                        ))}
                        {(req.source_opportunities || []).map((opp, oIdx) => (
                          <span key={oIdx} className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
                            {opp}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Distinct Acceptance Criteria Checklist */}
                    {req.acceptance_criteria && req.acceptance_criteria.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#1e293b]">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Acceptance Criteria:
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {req.acceptance_criteria.map((crit, cIdx) => (
                            <li key={cIdx} className="flex items-start gap-2 bg-[#070b13] p-2.5 rounded-lg border border-[#1e293b]/60">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{crit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Stories Subtab */}
          {activeSubtab === 'User Stories' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                User Stories ({userStories.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userStories.map((us, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#111827] border border-[#223048] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-violet-400">
                        {us.story_id || `US-${idx + 1}`}
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold uppercase">
                        {us.persona || 'Enterprise User'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{us.title}</h4>
                    <p className="text-xs text-slate-300 italic bg-[#070b13] p-3 rounded-lg border border-[#1e293b]">
                      "{us.story || `As a user, I want ${us.title} so that I can perform operations smoothly.`}"
                    </p>
                    {us.acceptance_criteria && us.acceptance_criteria.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Acceptance Criteria:</span>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          {us.acceptance_criteria.slice(0, 2).map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Subtab */}
          {activeSubtab === 'Features' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Features & Modules ({features.length})
              </h3>
              <div className="space-y-3">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#111827] border border-[#223048] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-violet-400">
                          {feat.feature_id || `FEAT-${idx + 1}`}
                        </span>
                        <h4 className="text-xs font-bold text-white">{feat.name}</h4>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                        {feat.status || 'Planned'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{feat.description}</p>
                    {feat.reason && (
                      <p className="text-[11px] text-slate-400 italic">Reason: {feat.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NFRs Subtab */}
          {activeSubtab === 'NFRs' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Non-Functional Requirements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[#111827] border border-[#223048] space-y-1.5">
                  <div className="flex items-center gap-2 text-violet-400 font-bold text-xs">
                    <Activity className="w-4 h-4" />
                    <span>NFR-001: Latency & Throughput SLA</span>
                  </div>
                  <p className="text-xs text-slate-300">p95 API response times remain below 450ms under peak load.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#111827] border border-[#223048] space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>NFR-002: Security & Encryption</span>
                  </div>
                  <p className="text-xs text-slate-300">100% TLS 1.3 encryption in transit and AES-256 for credentials at rest.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#111827] border border-[#223048] space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                    <Layers className="w-4 h-4" />
                    <span>NFR-003: Observability</span>
                  </div>
                  <p className="text-xs text-slate-300">Structured telemetry logging for every state mutation with trace IDs.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#111827] border border-[#223048] space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Target className="w-4 h-4" />
                    <span>NFR-004: High Availability</span>
                  </div>
                  <p className="text-xs text-slate-300">Target 99.9% uptime with automated health-check failover.</p>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Subtab */}
          {activeSubtab === 'Metrics' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Success Metrics & KPIs ({successMetrics.length})
              </h3>
              <div className="space-y-2.5">
                {successMetrics.map((met, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#111827] border border-[#223048] flex items-center gap-3 text-xs text-slate-200"
                  >
                    <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{met}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks Subtab */}
          {activeSubtab === 'Risks' && (
            <div className="space-y-4 max-w-4xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Risks, Constraints & Dependencies
              </h3>
              <div className="space-y-3">
                {risks.map((risk, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#111827] border border-amber-500/20 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Risk #{idx + 1}</span>
                    </div>
                    <p className="text-slate-300">{typeof risk === 'string' ? risk : `${risk.risk} (Mitigation: ${risk.mitigation})`}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
