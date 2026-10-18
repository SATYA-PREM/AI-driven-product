import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  Sparkles,
  Shield,
  Eye,
  CheckSquare,
  ArrowRight,
  ExternalLink,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2,
  FileText
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import { getSessionCache } from '../../api/core';
import DesignResponseModal from './components/DesignResponseModal';
import { useTheme } from '../../context/ThemeContext';

export default function DesignerUXRequirements() {
  const { isDark } = useTheme();
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/designer/ux-requirements` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [uxItems, setUxItems] = useState(() => (Array.isArray(initialCache) ? initialCache : []));
  const [loading, setLoading] = useState(() => !Array.isArray(initialCache));
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('submission');

  // Filter & Search states
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Minimise / Expand cards state: default to minimised (empty expandedItems means all collapsed)
  const [expandedItems, setExpandedItems] = useState({});

  const toggleCollapse = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const collapseAll = () => {
    setExpandedItems({});
  };

  const expandAll = () => {
    const all = {};
    uxItems.forEach((item) => {
      all[item.requirement_id] = true;
    });
    setExpandedItems(all);
  };

  const isAllCollapsed = useMemo(() => {
    if (!uxItems.length) return true;
    return !uxItems.some((item) => expandedItems[item.requirement_id]);
  }, [uxItems, expandedItems]);

  const fetchUXRequirements = async () => {
    if (!workspaceId) return;
    const cached = getSessionCache(cacheKey);
    if (!cached && uxItems.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await designerApi.getUXRequirements(workspaceId);
      if (Array.isArray(res)) setUxItems(res);
    } catch (err) {
      console.warn('Error fetching UX requirements:', err);
      if (uxItems.length === 0) setError(err.message || 'Failed to load UX requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUXRequirements();

    const onCacheUpdate = (e) => {
      if (e.detail?.endpoint === cacheKey && Array.isArray(e.detail?.data)) {
        setUxItems(e.detail.data);
      }
    };
    window.addEventListener('cache_updated', onCacheUpdate);
    return () => window.removeEventListener('cache_updated', onCacheUpdate);
  }, [workspaceId]);

  const handleOpenTask = (item, tab = 'submission') => {
    const id = item.assignment_id || item.requirement_id || item.id;
    if (id) {
      navigate(`/workspace/${workspaceId}/designer/assignments/${id}?tab=${tab}`);
      return;
    }
    setSelectedTask({
      assignment_id: item.assignment_id || item.requirement_id,
      requirement_id: item.requirement_id,
      requirement_title: item.requirement_title,
      prd_title: item.prd_title,
      prd_version: item.prd_version,
      problem_statement: item.problem_statement,
      response: item.response,
      figma_url: item.figma_url,
      prototype_url: item.prototype_url,
      blocker_comment: item.blocker_comment,
      status: item.status,
      review_status: item.review_status,
      review_comments: item.review_comments,
      revision_count: item.revision_count,
      deliverables: item.deliverables,
    });
    setModalInitialTab(tab);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    fetchUXRequirements();
  };

  // Filtered & Sorted items
  const filteredUXItems = useMemo(() => {
    const list = uxItems.filter((item) => {
      // Priority filter
      if (priorityFilter !== 'ALL') {
        const itemPri = (item.priority || 'HIGH').toUpperCase();
        if (itemPri !== priorityFilter.toUpperCase()) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'REVISION_REQUESTED') {
          if (item.status !== 'REVISION_REQUESTED' && item.review_status !== 'REVISION_REQUESTED') return false;
        } else if (statusFilter === 'SUBMITTED_FOR_REVIEW') {
          if (item.status !== 'SUBMITTED_FOR_REVIEW' && item.review_status !== 'PENDING_REVIEW') return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const reqTitle = (item.requirement_title || '').toLowerCase();
        const reqId = (item.requirement_id || '').toLowerCase();
        const prdTitle = (item.prd_title || '').toLowerCase();
        const prob = (item.problem_statement || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        return (
          reqTitle.includes(q) ||
          reqId.includes(q) ||
          prdTitle.includes(q) ||
          prob.includes(q) ||
          cat.includes(q)
        );
      }
      return true;
    });

    // Default sort by priority: CRITICAL > HIGH > MEDIUM > LOW
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return [...list].sort((a, b) => {
      const pa = priorityOrder[(a.priority || 'HIGH').toUpperCase()] ?? 4;
      const pb = priorityOrder[(b.priority || 'HIGH').toUpperCase()] ?? 4;
      return pa - pb;
    });
  }, [uxItems, priorityFilter, statusFilter, searchQuery]);

  // Counts by priority
  const priorityCounts = useMemo(() => {
    const counts = { ALL: uxItems.length, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    uxItems.forEach((item) => {
      const p = (item.priority || 'HIGH').toUpperCase();
      if (counts[p] !== undefined) counts[p]++;
    });
    return counts;
  }, [uxItems]);

  return (
    <div className={`w-full font-sans space-y-6 pb-12 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${
        isDark ? 'border-white/[0.06]' : 'border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400' : 'bg-purple-50 border border-purple-200 text-purple-600'
            }`}>
              <Palette size={20} />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              UX Requirements & UI Guidelines
            </h1>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
              Interaction Design
            </span>
          </div>
          <p className={`text-xs pl-11 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Human-centered UX specifications, interaction flow diagrams, responsive component states, and accessibility criteria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <Sparkles size={14} className="text-purple-500" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Left Side: Priority Dropdown + Status Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Priority Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <Filter size={13} className="text-purple-500" />
              <span>Priority:</span>
            </span>
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`appearance-none text-xs font-bold pl-3 pr-8 py-1.5 rounded-xl border transition-colors cursor-pointer outline-none ${
                  isDark
                    ? 'bg-[#12172b] border-white/[0.12] text-white hover:border-purple-400 focus:border-purple-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-purple-300 focus:border-purple-600 shadow-xs'
                }`}
              >
                <option value="ALL">All Priorities ({priorityCounts.ALL})</option>
                <option value="CRITICAL">Critical ({priorityCounts.CRITICAL})</option>
                <option value="HIGH">High ({priorityCounts.HIGH})</option>
                <option value="MEDIUM">Medium ({priorityCounts.MEDIUM})</option>
                <option value="LOW">Low ({priorityCounts.LOW})</option>
              </select>
              <ChevronDown size={13} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Status:
            </span>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`appearance-none text-xs font-bold pl-3 pr-8 py-1.5 rounded-xl border transition-colors cursor-pointer outline-none ${
                  isDark
                    ? 'bg-[#12172b] border-white/[0.12] text-white hover:border-purple-400 focus:border-purple-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-purple-300 focus:border-purple-600 shadow-xs'
                }`}
              >
                <option value="ALL">All Statuses</option>
                <option value="NOT_STARTED">Pending / Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SUBMITTED_FOR_REVIEW">In PM Review</option>
                <option value="REVISION_REQUESTED">Revision Requested</option>
                <option value="COMPLETED">Completed & Handed Off</option>
                <option value="BLOCKED">Blocked</option>
              </select>
              <ChevronDown size={13} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
          </div>
        </div>

        {/* Right Side: Search Box & Collapse / Expand All toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search UX guidelines..."
              className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs transition-colors outline-none border ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-purple-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 shadow-xs'
              }`}
            />
          </div>

          {/* Minimise / Expand All Button */}
          <button
            type="button"
            onClick={isAllCollapsed ? expandAll : collapseAll}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
            }`}
            title={isAllCollapsed ? 'Expand all requirements' : 'Minimise all requirements'}
          >
            {isAllCollapsed ? (
              <>
                <Maximize2 size={13} className="text-purple-500" />
                <span>Expand All</span>
              </>
            ) : (
              <>
                <Minimize2 size={13} className="text-purple-500" />
                <span>Minimise All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`p-16 text-center text-xs border backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg ${
          isDark ? 'text-slate-400 bg-[#090d1c]/80 border-white/[0.08]' : 'text-slate-500 bg-white border-slate-200'
        }`}>
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading UX specifications...</span>
        </div>
      ) : filteredUXItems.length === 0 ? (
        <div className={`p-16 text-center text-xs border backdrop-blur-xl rounded-2xl space-y-2 shadow-lg ${
          isDark ? 'text-slate-400 bg-[#090d1c]/80 border-white/[0.08]' : 'text-slate-500 bg-white border-slate-200'
        }`}>
          <Palette size={36} className={`mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>No UX Requirements Found</p>
          <p className={`max-w-sm mx-auto ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            {searchQuery || priorityFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No UX requirements match your current filter and search criteria.'
              : 'There are no active UX requirements in this workspace yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUXItems.map((item) => {
            const isCollapsed = !expandedItems[item.requirement_id];
            const pri = (item.priority || 'HIGH').toUpperCase();

            return (
              <div
                key={item.requirement_id}
                className={`border rounded-2xl transition-all shadow-sm ${
                  isDark
                    ? 'bg-[#090d1c]/80 border-white/[0.08] backdrop-blur-xl hover:border-purple-500/40'
                    : 'bg-white border-slate-200 hover:border-purple-300 shadow-xs'
                }`}
              >
                {/* Header row - always visible */}
                <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !isCollapsed ? (isDark ? 'border-b border-white/[0.05]' : 'border-b border-slate-100') : ''
                }`}>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono text-xs px-2.5 py-0.5 rounded font-bold border ${
                        isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {item.requirement_id}
                      </span>

                      {/* Priority Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        pri === 'CRITICAL'
                          ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-50 text-rose-700 border-rose-200'
                          : pri === 'HIGH'
                          ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200'
                          : pri === 'MEDIUM'
                          ? isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                          : isDark ? 'bg-slate-500/20 text-slate-300 border-slate-500/40' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {pri} Priority
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'COMPLETED'
                            ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : (item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED')
                            ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200'
                            : (item.status === 'SUBMITTED_FOR_REVIEW' || item.review_status === 'PENDING_REVIEW')
                            ? isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.status === 'BLOCKED'
                            ? isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
                            : isDark ? 'bg-slate-500/10 text-slate-400 border-slate-500/30' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED'
                          ? `Revision Requested (#${item.revision_count || 1})`
                          : item.status === 'SUBMITTED_FOR_REVIEW' || item.review_status === 'PENDING_REVIEW'
                          ? 'In PM Review'
                          : item.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <h2 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.requirement_title}
                    </h2>

                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      PRD: <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.prd_title}</span> ({item.prd_version}) • Category: {item.category}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Show PRD of specific task button */}
                    {item.prd_id && (
                      <Link
                        to={`/workspace/${workspaceId}/prd/view?prdId=${item.prd_id}`}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                          isDark
                            ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-purple-400 hover:text-purple-300'
                            : 'bg-white hover:bg-purple-50 border-purple-200 text-purple-700 shadow-xs'
                        }`}
                        title={`Open PRD document: ${item.prd_id}`}
                      >
                        <FileText size={12} />
                        <span className="hidden sm:inline">View PRD</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenTask(item, 'clarification')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      Ask Question
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenTask(item, (item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED') ? 'feedback' : 'submission')}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {(item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED')
                          ? 'Review & Revise'
                          : item.response
                          ? 'Update Specs'
                          : 'Submit Design Response'}
                      </span>
                      <ArrowRight size={13} />
                    </button>

                    {/* Minimise / Expand Button */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(item.requirement_id)}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
                        isDark
                          ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-400 hover:text-white'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                      title={isCollapsed ? 'Expand details' : 'Minimise card'}
                    >
                      {isCollapsed ? (
                        <>
                          <ChevronDown size={14} className="text-purple-500" />
                          <span className="text-[11px] pr-1">Expand</span>
                        </>
                      ) : (
                        <>
                          <ChevronUp size={14} className="text-purple-500" />
                          <span className="text-[11px] pr-1">Minimise</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Body Details */}
                {!isCollapsed && (
                  <div className="p-5 space-y-5 animate-in fade-in duration-150">
                    {/* Problem Statement & Interaction Flow */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl border space-y-1.5 ${
                        isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200/80'
                      }`}>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                          Problem Context & Customer Impact
                        </span>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.problem_statement}</p>
                        {item.customer_impact && (
                          <p className={`text-[11px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Impact: {item.customer_impact}</p>
                        )}
                      </div>

                      <div className={`p-4 rounded-xl border space-y-1.5 ${
                        isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200/80'
                      }`}>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">
                          Recommended Interaction Flow
                        </span>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.interaction_flow}</p>
                      </div>
                    </div>

                    {/* 4 Required UI States Grid */}
                    <div className="space-y-2.5">
                      <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <Eye size={14} className="text-purple-500" />
                        <span>Required Component UI States</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {item.ui_states && Object.entries(item.ui_states).map(([stName, stDesc]) => (
                          <div key={stName} className={`p-3.5 rounded-xl border space-y-1 ${
                            isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200/80'
                          }`}>
                            <span className={`text-[11px] font-bold block ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{stName}</span>
                            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{stDesc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Acceptance Criteria & Accessibility Standards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Acceptance Criteria */}
                      <div className={`p-4 rounded-xl border space-y-2 ${
                        isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200/80'
                      }`}>
                        <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare size={14} />
                          <span>Design Acceptance Criteria</span>
                        </h4>
                        <ul className="space-y-1.5">
                          {item.acceptance_criteria && item.acceptance_criteria.map((crit, idx) => (
                            <li key={idx} className={`flex items-start gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <span className="text-emerald-500 font-bold mt-0.5">•</span>
                              <span>{crit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Accessibility Standards */}
                      <div className={`p-4 rounded-xl border space-y-2 ${
                        isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200/80'
                      }`}>
                        <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Shield size={14} />
                          <span>Accessibility Criteria (WCAG 2.1 AA)</span>
                        </h4>
                        <ul className="space-y-1.5">
                          {item.accessibility_criteria && item.accessibility_criteria.map((crit, idx) => (
                            <li key={idx} className={`flex items-start gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <span className="text-indigo-500 font-bold mt-0.5">✓</span>
                              <span>{crit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Figma Link & Submitted Response if existing */}
                    {(item.figma_url || item.response) && (
                      <div className={`p-4 rounded-xl border space-y-2 ${
                        isDark ? 'bg-purple-950/20 border-purple-500/25' : 'bg-purple-50/60 border-purple-200'
                      }`}>
                        {item.figma_url && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Figma Asset Link:</span>
                            <a
                              href={item.figma_url}
                              target="_blank"
                              rel="noreferrer"
                              className={`text-xs underline font-mono flex items-center gap-1 ${
                                isDark ? 'text-purple-400 hover:text-white' : 'text-purple-600 hover:text-purple-900'
                              }`}
                            >
                              <span>{item.figma_url}</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        )}
                        {item.response && (
                          <div className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`font-bold block mb-0.5 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Design Response Notes:</span>
                            <p className="whitespace-pre-wrap leading-relaxed">{item.response}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      <DesignResponseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={handleSaved}
        initialTab={modalInitialTab}
      />
    </div>
  );
}
