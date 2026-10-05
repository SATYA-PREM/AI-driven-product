import React, { useState, useMemo } from 'react';
import {
  Layers,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  Copy,
  Sparkles,
  Search,
  Filter,
  Users,
  Target,
  Clock,
  ShieldCheck,
  Quote,
  ExternalLink,
  MessageSquare,
  Send,
  X,
  Code2,
  Check,
  Building2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { formatLocalDate } from '../utils/formatDate';

export default function PRDFeatureDetailViewer({
  prdData,
  onOpenTraceModal,
  onGoToGenerator,
  onGenerateCirculationPackage,
}) {
  const project = prdData?.project || {};
  const doc = prdData?.document || {};
  const context = prdData?.context || {};
  const features = prdData?.features || [];
  const requirements = prdData?.requirements || [];
  const userStories = prdData?.user_stories || [];
  const evidenceRecords = context?.evidence_records || [];

  const [selectedFeatureIds, setSelectedFeatureIds] = useState(
    features.map((f, idx) => f.feature_id || `FEAT-${idx + 1}`)
  );
  const [expandedFeatureIds, setExpandedFeatureIds] = useState(new Set([features[0]?.feature_id || 'FEAT-001']));
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isCirculationModalOpen, setIsCirculationModalOpen] = useState(false);
  const [circulationNotes, setCirculationNotes] = useState(
    'Please review the feature specifications, acceptance criteria, and verified root causes below. Submit corrections or architectural sign-off prior to sprint allocation.'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [circulationResult, setCirculationResult] = useState(null);
  const [copyToast, setCopyToast] = useState(false);

  // Sync selected IDs when features change
  React.useEffect(() => {
    if (features.length > 0 && selectedFeatureIds.length === 0) {
      setSelectedFeatureIds(features.map((f, idx) => f.feature_id || `FEAT-${idx + 1}`));
      setExpandedFeatureIds(new Set([features[0]?.feature_id || 'FEAT-001']));
    }
  }, [features]);

  if (!prdData || !prdData.project) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center space-y-4 select-none animate-fadeIn max-w-5xl mx-auto">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <Layers className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-white">No PRD Document Available</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate a PRD document from the PM-approved feedback items in the PRD Studio to inspect feature breakdowns and export team circulation packages.
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

  const toggleExpand = (featureId) => {
    setExpandedFeatureIds((prev) => {
      const next = new Set(prev);
      if (next.has(featureId)) next.delete(featureId);
      else next.add(featureId);
      return next;
    });
  };

  const toggleSelect = (featureId) => {
    setSelectedFeatureIds((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFeatureIds.length === filteredFeatures.length) {
      setSelectedFeatureIds([]);
    } else {
      setSelectedFeatureIds(filteredFeatures.map((f, idx) => f.feature_id || `FEAT-${idx + 1}`));
    }
  };

  // Filter features
  const filteredFeatures = useMemo(() => {
    return features.filter((feat, idx) => {
      const fid = feat.feature_id || `FEAT-${idx + 1}`;
      const name = feat.name || feat.title || '';
      const desc = feat.description || '';
      const priority = (feat.ai_recommended_priority || feat.priority || 'high').toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || priority === priorityFilter.toLowerCase();
      return matchesSearch && matchesPriority;
    });
  }, [features, searchQuery, priorityFilter]);

  // Handle Export / View Circulation Package
  const handleOpenCirculationModal = async () => {
    if (selectedFeatureIds.length === 0) return;
    setIsExporting(true);
    setIsCirculationModalOpen(true);
    try {
      if (onGenerateCirculationPackage) {
        const result = await onGenerateCirculationPackage({
          feature_ids: selectedFeatureIds,
          circulation_notes: circulationNotes,
          reviewer_name: 'Priya Sharma (PM)',
        });
        setCirculationResult(result);
      }
    } catch (err) {
      console.error('Failed to generate circulation package:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (circulationResult?.markdown_content) {
      navigator.clipboard.writeText(circulationResult.markdown_content);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!circulationResult?.markdown_content) return;
    const blob = new Blob([circulationResult.markdown_content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${project.prd_id || 'PRD'}_Circulation_Package.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printArea = document.getElementById('prd-circulation-print-area');
    if (!printArea) {
      window.print();
      return;
    }

    // Create an isolated hidden iframe to guarantee clean, unclipped multi-page pagination
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow.document;
    frameDoc.open();

    // Clone all stylesheets and Tailwind rules to ensure accurate typography & colors
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project.prd_id || 'PRD'}_Circulation_Package</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${styles}
          <style>
            @page {
              size: letter portrait;
              margin: 15mm 15mm 15mm 15mm;
            }
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              font-size: 10pt !important;
              line-height: 1.5 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              height: auto !important;
              min-height: auto !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #prd-circulation-print-area {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              box-shadow: none !important;
              border: none !important;
            }
            .print-card-avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-bottom: 24px !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body class="bg-white text-slate-900 p-0 m-0">
          ${printArea.outerHTML}
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Iframe print failed, fallback to window.print():', e);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1200);
      }
    }, 250);
  };

  const selectedFeaturesList = features.filter((f, idx) =>
    selectedFeatureIds.includes(f.feature_id || `FEAT-${idx + 1}`)
  );

  return (
    <div className="space-y-6 select-none animate-fadeIn max-w-6xl mx-auto">
      {/* 1. Header Toolbar */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-violet-400">{project.prd_id}</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                Version {project.current_version || doc.version || 'v1.0'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                {project.status || 'DRAFT'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              PRD Feature Deep-Dive & Team Circulation Studio
            </h2>
            <p className="text-xs text-slate-400">
              Inspect granular customer issues, verified root causes, functional specifications, and user stories. Select features to export a dedicated, printable team circulation document.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCirculationModal}
              disabled={selectedFeatureIds.length === 0 || isExporting}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                selectedFeatureIds.length === 0 || isExporting
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/25'
              }`}
            >
              <FileText className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
              <span>
                {isExporting
                  ? 'Compiling Pack...'
                  : `Export Circulation PRD (${selectedFeatureIds.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Search, Filter & Bulk Select Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#111827] px-3 py-1.5 rounded-xl border border-[#223048] hover:border-slate-500 transition-colors cursor-pointer"
            >
              {selectedFeatureIds.length === filteredFeatures.length && filteredFeatures.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{selectedFeatureIds.length === filteredFeatures.length ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/20">
              {selectedFeatureIds.length} of {features.length} Features Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search feature, issue, req..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111827] border border-[#223048] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 w-56"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#111827] border border-[#223048] rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Feature Deep-Dive Accordion Cards */}
      <div className="space-y-4">
        {filteredFeatures.length === 0 ? (
          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center text-slate-500 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No features match the filter query.</p>
          </div>
        ) : (
          filteredFeatures.map((feat, idx) => {
            const fid = feat.feature_id || `FEAT-${idx + 1}`;
            const reqId = fid.replace('FEAT-', 'REQ-');
            const isSelected = selectedFeatureIds.includes(fid);
            const isExpanded = expandedFeatureIds.has(fid);
            const priority = (feat.ai_recommended_priority || feat.priority || 'high').toUpperCase();

            // Find linked requirement, stories, and customer issues
            const linkedReq = requirements.find((r) => r.requirement_id === reqId || r.requirement_id === fid) || {};
            const linkedStories = userStories.filter((s) => s.requirement_id === reqId || s.feature_id === fid);
            const sourceInsightIds = linkedReq.source_insights || linkedReq.source_issues || [];
            const linkedIssues = (context.approved_issues || []).filter((i) =>
              sourceInsightIds.includes(i.issue_id || i.id)
            );
            const linkedOpps = (context.approved_opportunities || []).filter((o) =>
              sourceInsightIds.includes(o.opportunity_id || o.id)
            );
            const linkedEvidenceIds = linkedReq.source_evidence || [];
            const linkedEvidence = evidenceRecords.filter((e) =>
              linkedEvidenceIds.includes(e.id || e.feedback_id)
            );

            return (
              <div
                key={fid}
                className={`rounded-2xl border transition-all overflow-hidden shadow-xl ${
                  isSelected
                    ? 'bg-[#0b101b] border-violet-500/40 shadow-violet-950/20'
                    : 'bg-[#0b101b] border-[#1e293b] opacity-80'
                }`}
              >
                {/* Feature Header Bar */}
                <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 bg-[#0d1424]/80">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleSelect(fid)}
                      className="pt-0.5 sm:pt-0 text-violet-400 hover:text-violet-300 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-violet-400 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600 hover:text-slate-400 shrink-0" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                          {fid}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            priority === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : priority === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {priority} Priority
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {feat.target_phase || 'Phase 1: Friction Remediation'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white truncate">
                        {feat.name || feat.title || `Module ${fid}`}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{feat.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => toggleExpand(fid)}
                      className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-[#1a2336] border border-[#223048] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Collapse Details' : 'View Deep-Dive'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-violet-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Deep-Dive Details Dropdown / Panel */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-[#1e293b] bg-[#070b13] space-y-6 animate-fadeIn">
                    {/* 1. Customer Problem & Root Cause Breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-rose-400">
                        <AlertTriangle className="w-4 h-4" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                          1. Customer Problem, Symptoms & Verified Root Cause
                        </h4>
                      </div>

                      {linkedIssues.length > 0 || linkedOpps.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {linkedIssues.map((issue) => (
                            <div
                              key={issue.issue_id || issue.id}
                              className="bg-[#0e1422] border border-[#223048] rounded-xl p-4 space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                                  {issue.issue_id || issue.id}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                  Impact: {issue.customer_impact || 'HIGH'}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-white">{issue.title}</h5>
                              <p className="text-[11px] text-slate-300 leading-relaxed">
                                {issue.problem_description || issue.description}
                              </p>
                              {issue.root_cause && (
                                <div className="p-2.5 rounded-lg bg-[#070a12] border border-rose-500/20 text-[11px] text-rose-200">
                                  <span className="font-bold text-rose-300">Technical Root Cause: </span>
                                  {issue.root_cause}
                                </div>
                              )}
                              {issue.symptoms && issue.symptoms.length > 0 && (
                                <div className="text-[11px] text-slate-400 space-y-1">
                                  <span className="font-bold text-slate-300">Observed Symptoms:</span>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {issue.symptoms.map((sym, sIdx) => (
                                      <li key={sIdx}>{sym}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}

                          {linkedOpps.map((opp) => (
                            <div
                              key={opp.opportunity_id || opp.id}
                              className="bg-[#0e1422] border border-[#223048] rounded-xl p-4 space-y-2"
                            >
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                {opp.opportunity_id || opp.id}
                              </span>
                              <h5 className="text-xs font-bold text-white">{opp.title}</h5>
                              <p className="text-[11px] text-slate-300">{opp.description}</p>
                              <div className="text-[10px] text-emerald-300">
                                Capability enhancement requested across workspace users.
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-[#0e1422] border border-[#223048] rounded-xl p-3.5 text-xs text-slate-400">
                          {feat.description || 'Friction identified across user operations.'}
                        </div>
                      )}
                    </div>

                    {/* 2. Functional Requirement & Acceptance Criteria */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-violet-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                          2. Functional Specification & Acceptance Criteria
                        </h4>
                      </div>

                      <div className="bg-[#0e1422] border border-[#223048] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-violet-400">
                              {linkedReq.requirement_id || reqId}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {linkedReq.title || feat.name}
                            </span>
                          </div>
                          <span className="text-[10px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded font-mono">
                            Type: {linkedReq.type || 'functional'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {linkedReq.description || feat.description}
                        </p>

                        {/* Acceptance Criteria Checklist */}
                        <div className="pt-2 border-t border-[#1e293b] space-y-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Testable Acceptance Criteria:
                          </span>
                          <div className="space-y-1.5">
                            {(linkedReq.acceptance_criteria || feat.acceptance_criteria || [
                              'Workflow completes within latency SLA of < 500ms.',
                              'Zero unhandled validation errors during data pipeline execution.',
                              'Full audit log record captured with user identity and timestamp.'
                            ]).map((ac, acIdx) => (
                              <div
                                key={acIdx}
                                className="flex items-start gap-2.5 p-2 rounded-lg bg-[#070a12] border border-[#1e293b] text-xs text-slate-300"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="flex-1">{ac}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. User Stories & Persona Scenarios */}
                    {linkedStories.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Users className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                            3. User Stories & Persona Workflow
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {linkedStories.map((story) => (
                            <div
                              key={story.story_id}
                              className="bg-[#0e1422] border border-[#223048] rounded-xl p-3.5 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-blue-400">
                                  {story.story_id}
                                </span>
                                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                                  Persona: {story.persona || 'enterprise_user'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                "{story.story || story.title}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Customer Evidence Quotes */}
                    {linkedEvidence.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-amber-400">
                          <Quote className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                            4. Customer Feedback Evidence & Verbatim Quotes ({linkedEvidence.length})
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {linkedEvidence.map((ev, eIdx) => (
                            <div
                              key={eIdx}
                              className="bg-[#0e1422] border border-[#223048] rounded-xl p-3.5 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span className="font-mono text-amber-400">{ev.id || `EV-${eIdx + 1}`}</span>
                                <span>Sentiment: Negative Friction</span>
                              </div>
                              <p className="text-xs text-slate-300 italic">
                                "{ev.text || ev.feedback_text || ev.quote || 'Customer feedback verbatim quote'}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3. Team Circulation Pack Modal (Clean White Paper Document on Screen & Print) */}
      {isCirculationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn overflow-y-auto">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header Actions (Excluded from print via .no-print) */}
            <div className="p-4 sm:p-5 border-b border-[#1e293b] bg-[#0b101b] flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-violet-400">{project.prd_id}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase">
                    Executive Circulation Document
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Formal PRD Circulation Package ({selectedFeatureIds.length} Features)
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-slate-800 border border-[#223048] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copyToast ? 'Copied!' : 'Copy Markdown'}</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-slate-800 border border-[#223048] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-violet-600/30"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setIsCirculationModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PM Notes Editor (Excluded from print via .no-print) */}
            <div className="p-4 bg-[#070b13] border-b border-[#1e293b] space-y-1.5 no-print">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-violet-400" />
                PM Reviewer Directives & Circulation Instructions:
              </label>
              <textarea
                value={circulationNotes}
                onChange={(e) => setCirculationNotes(e.target.value)}
                rows={2}
                className="w-full bg-[#111827] border border-[#223048] rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-violet-500 leading-relaxed"
                placeholder="Enter instructions or specific feedback requests for engineering and design leads..."
              />
            </div>

            {/* Document Sheet Area (Visible on Screen as White Paper & Cleanly Targeted by Print) */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-900/60">
              <div
                id="prd-circulation-print-area"
                className="bg-white text-slate-900 p-8 sm:p-12 space-y-8 rounded-xl shadow-2xl border border-slate-200 max-w-4xl mx-auto font-sans leading-normal"
              >
                {/* 1. Formal Document Masthead */}
                <div className="border-b-2 border-slate-900 pb-5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                    <span>ProdAI • Product Intelligence Assistant</span>
                    <span>Confidential • Internal Circulation Only</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-snug">
                    {doc.title || project.title || 'Product Requirements Document'}
                  </h1>

                  {/* Metadata Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs border-t border-slate-200">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">PRD Identifier</span>
                      <span className="font-mono font-bold text-slate-900">{project.prd_id || 'PRD-ACTIVE'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Document Version</span>
                      <span className="font-bold text-slate-900">{project.current_version || doc.version || 'v1.0'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Reviewer Authority</span>
                      <span className="font-bold text-slate-900">Priya Sharma (PM)</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Circulation Date</span>
                      <span className="font-bold text-slate-900">{formatLocalDate(new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>

                {/* 2. PM Directives & Circulation Instructions */}
                {circulationNotes && (
                  <div className="bg-slate-50 border-l-4 border-violet-600 p-4 rounded-r-lg space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-900 block">
                      PM Circulation Directives & Review Guidelines
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium italic">
                      "{circulationNotes}"
                    </p>
                  </div>
                )}

                {/* 3. Executive Summary */}
                <div className="space-y-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                    1. Executive Summary & Problem Context
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">
                    {doc.background ||
                      doc.executive_summary ||
                      'This Product Requirements Document establishes the formal development roadmap to resolve customer-reported friction by delivering structured, verified, and permission-aware workflows.'}
                  </p>
                </div>

                {/* 4. Selected Feature Specifications */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      2. Detailed Feature Specifications ({selectedFeaturesList.length} Selected)
                    </h2>
                    <span className="text-[10px] font-mono text-slate-500">
                      Traceable to PM-Approved Intelligence
                    </span>
                  </div>

                  <div className="space-y-6">
                    {selectedFeaturesList.map((feat, idx) => {
                      const fid = feat.feature_id || `FEAT-${idx + 1}`;
                      const reqId = fid.replace('FEAT-', 'REQ-');
                      const linkedReq = requirements.find((r) => r.requirement_id === reqId || r.requirement_id === fid) || {};
                      const linkedStories = userStories.filter((s) => s.requirement_id === reqId || s.feature_id === fid);
                      const sourceInsightIds = linkedReq.source_insights || linkedReq.source_issues || [];
                      const linkedIssues = (context.approved_issues || []).filter((i) =>
                        sourceInsightIds.includes(i.issue_id || i.id)
                      );
                      const linkedEvidenceIds = linkedReq.source_evidence || [];
                      const linkedEvidence = evidenceRecords.filter((e) =>
                        linkedEvidenceIds.includes(e.id || e.feedback_id)
                      );

                      return (
                        <div
                          key={fid}
                          className="border border-slate-300 rounded-xl p-5 bg-white space-y-4 print-card-avoid-break shadow-sm"
                        >
                          {/* Feature Header */}
                          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2.5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded">
                                  {fid}
                                </span>
                                <h3 className="text-sm font-black text-slate-950">{feat.name || feat.title}</h3>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                                {feat.description || linkedReq.description}
                              </p>
                            </div>
                            <div className="text-right shrink-0 space-y-0.5">
                              <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                                Priority: {(feat.ai_recommended_priority || feat.priority || 'HIGH').toUpperCase()}
                              </span>
                              <span className="block text-[10px] font-mono text-slate-500">
                                {feat.target_phase || 'Phase 1'}
                              </span>
                            </div>
                          </div>

                          {/* Customer Problem & Root Cause */}
                          {linkedIssues.length > 0 && (
                            <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                                Customer Problem & Root Cause:
                              </span>
                              {linkedIssues.map((issue) => (
                                <div key={issue.issue_id || issue.id} className="space-y-1 text-slate-700">
                                  <p className="font-semibold text-slate-900">
                                    • [{issue.issue_id || issue.id}] {issue.title}: {issue.problem_description || issue.description}
                                  </p>
                                  {issue.root_cause && (
                                    <p className="text-[11px] text-slate-600 pl-3">
                                      <span className="font-bold text-slate-800">Root Cause:</span> {issue.root_cause}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Functional Requirements & Acceptance Criteria */}
                          <div className="space-y-2 text-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                              Functional Requirements & Testable Criteria:
                            </span>
                            <div className="space-y-1.5 pl-1">
                              {(linkedReq.acceptance_criteria || feat.acceptance_criteria || [
                                'Execution completes without unhandled exceptions under standard workload.',
                                'Latency conforms to operational SLA of < 500ms.',
                                'Audit telemetry logs captured with timestamp and actor attribution.'
                              ]).map((ac, acIdx) => (
                                <div key={acIdx} className="flex items-start gap-2 text-slate-800">
                                  <span className="font-mono text-slate-400 font-bold mt-0.5">[✓]</span>
                                  <span className="flex-1 leading-snug">{ac}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* User Stories */}
                          {linkedStories.length > 0 && (
                            <div className="space-y-1 text-xs pt-1 border-t border-slate-100">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                                User Story:
                              </span>
                              <p className="text-slate-800 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                                "{linkedStories[0]?.story || linkedStories[0]?.title}"
                              </p>
                            </div>
                          )}

                          {/* Customer Feedback Evidence Quotes */}
                          {linkedEvidence.length > 0 && (
                            <div className="space-y-1 text-xs pt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                Customer Feedback Verbatim:
                              </span>
                              <blockquote className="border-l-2 border-slate-400 pl-3 py-1 text-[11px] text-slate-600 italic">
                                "{linkedEvidence[0]?.text || linkedEvidence[0]?.feedback_text || linkedEvidence[0]?.quote || 'Customer feedback verbatim quote'}"
                              </blockquote>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Formal Engineering Sign-off & Notes Section */}
                <div className="border-t-2 border-slate-300 pt-6 space-y-4 print-card-avoid-break">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    3. Team Review, Corrections & Sign-Off
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs text-slate-700">
                    <div className="border border-slate-200 p-3 rounded-lg space-y-4">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Engineering Lead Sign-Off</span>
                      <div className="space-y-2 pt-2">
                        <div className="border-b border-slate-300 pb-1 text-slate-400">Signature: __________________________</div>
                        <div className="border-b border-slate-300 pb-1 text-slate-400">Date: ______________ Status: [ ] Approved [ ] Changes Requested</div>
                      </div>
                    </div>
                    <div className="border border-slate-200 p-3 rounded-lg space-y-4">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">QA / Architecture Sign-Off</span>
                      <div className="space-y-2 pt-2">
                        <div className="border-b border-slate-300 pb-1 text-slate-400">Signature: __________________________</div>
                        <div className="border-b border-slate-300 pb-1 text-slate-400">Date: ______________ Status: [ ] Approved [ ] Changes Requested</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
