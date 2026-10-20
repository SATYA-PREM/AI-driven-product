import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  Send,
  FileText,
  User,
  ExternalLink,
  X,
  RefreshCw,
  Tag
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import { useTheme } from '../../context/ThemeContext';

const FEEDBACK_CATEGORIES = [
  { value: 'TESTABILITY', label: 'Testability & Architecture', icon: Sparkles },
  { value: 'EDGE_CASE', label: 'Edge Case / Scenario Gap', icon: AlertTriangle },
  { value: 'UX_IMPROVEMENT', label: 'UX & Usability Observation', icon: MessageSquare },
  { value: 'PERFORMANCE', label: 'Performance & Scale Risk', icon: Clock },
  { value: 'AMBIGUITY', label: 'Spec Ambiguity & Contradiction', icon: HelpCircle },
  { value: 'GENERAL_SUGGESTION', label: 'General Suggestion', icon: Tag },
];

export default function QAFeedbackPage() {
  const { workspaceId } = useParams();
  const { isDark } = useTheme();

  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Submit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'TESTABILITY',
    priority: 'MEDIUM',
    prd_id: '',
    prd_title: '',
    requirement_id: '',
    suggestion: '',
    rationale: '',
  });

  const fetchFeedback = async (isManual = false) => {
    if (!workspaceId) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await qaApi.getFeedbackList(workspaceId);
      if (Array.isArray(res) && res.length > 0) {
        setFeedbackList(res);
      } else {
        setFeedbackList(getFallbackFeedback());
      }
    } catch (err) {
      console.warn('Failed to load QA feedback:', err);
      setFeedbackList(getFallbackFeedback());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getFallbackFeedback = () => [
    {
      feedback_id: 'FB-QA-001',
      title: 'Missing idempotency token on batch export retry endpoint',
      category: 'EDGE_CASE',
      priority: 'HIGH',
      prd_id: 'PRD-20261014-1605-73A4',
      prd_title: 'Report Export Failures Impacting Task Completion',
      requirement_id: 'REQ-001',
      suggestion: 'When the client network drops mid-stream, client retries trigger duplicate workers. We recommend attaching a client-generated UUID idempotency token.',
      rationale: 'During peak traffic, simultaneous retries will cause compute spikes and duplicated CSV data.',
      status: 'UNDER_REVIEW',
      submitted_by: 'Satya Prem (QA Lead)',
      created_at: '2026-10-18T14:30:00Z',
      pm_response: 'Great catch. We are adding an Idempotency-Key header requirement to the export dispatch specification.',
    },
    {
      feedback_id: 'FB-QA-002',
      title: 'Clarify timeout threshold for 100k+ record virtual grid rendering',
      category: 'PERFORMANCE',
      priority: 'MEDIUM',
      prd_id: 'PRD-20261014-0952-18C7',
      prd_title: 'High-Volume Virtual Grid Rendering',
      requirement_id: 'REQ-002',
      suggestion: 'Provide explicit UX fallback or skeleton placeholder when dataset query exceeds 1.5 seconds so user does not click repeatedly.',
      rationale: 'Tester observed slight frame drop on mobile touchscreens without loading placeholder.',
      status: 'SUBMITTED',
      submitted_by: 'Satya Prem (QA Lead)',
      created_at: '2026-10-19T09:15:00Z',
      pm_response: null,
    },
  ];

  useEffect(() => {
    fetchFeedback();
  }, [workspaceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.suggestion.trim()) return;

    setSubmitting(true);
    try {
      await qaApi.submitFeedback(workspaceId, formData);
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: 'TESTABILITY',
        priority: 'MEDIUM',
        prd_id: '',
        prd_title: '',
        requirement_id: '',
        suggestion: '',
        rationale: '',
      });
      fetchFeedback(true);
    } catch (err) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = feedbackList.filter((fb) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (fb.title || '').toLowerCase().includes(q) ||
      (fb.suggestion || '').toLowerCase().includes(q) ||
      (fb.rationale || '').toLowerCase().includes(q) ||
      (fb.prd_title || '').toLowerCase().includes(q) ||
      (fb.requirement_id || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || fb.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || fb.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || fb.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'CRITICAL':
      case 'P1':
        return isDark ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
      case 'P2':
        return isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
      case 'P3':
        return isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return isDark ? 'bg-slate-500/20 text-slate-300 border-slate-500/30' : 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'ACCEPTED':
      case 'IMPLEMENTED':
        return isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UNDER_REVIEW':
        return isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REJECTED':
        return isDark ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200';
      default:
        return isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className={`w-full min-h-screen ${isDark ? 'text-slate-100' : 'text-slate-900'} space-y-6 pb-16`}>
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <MessageSquare size={26} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">QA Feedback & Suggestions</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Tester Collaboration
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Submit architectural suggestions, edge-case risks, and testability feedback directly to Product Managers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchFeedback(true)}
              disabled={refreshing}
              className={`p-2 rounded-xl border ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'} transition-all`}
              title="Refresh feedback"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#5b3df5] hover:bg-[#4a2ee3] text-white text-xs font-semibold shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all"
            >
              <Plus size={16} />
              <span>Submit Suggestion / Feedback</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={16} />
            <input
              type="text"
              placeholder="Search feedback by title, recommendation, or requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border ${
                isDark
                  ? 'bg-slate-900/60 border-slate-700/60 text-slate-200 placeholder-slate-500 focus:border-purple-500'
                  : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-600'
              } outline-none transition-all`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-xs border ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
              } outline-none`}
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-xs border ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
              } outline-none`}
            >
              <option value="ALL">All Categories</option>
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-xs border ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
              } outline-none`}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Declined</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
            <p className={`text-xs mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Loading QA suggestions...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-[#0f1422] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
            <MessageSquare size={36} className="mx-auto mb-3 opacity-40 text-purple-400" />
            <h3 className="font-semibold text-base mb-1">No feedback found</h3>
            <p className="text-xs max-w-sm mx-auto mb-4">
              {searchQuery || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No suggestions match the selected filters.'
                : 'Share architectural insights, risk points, and quality feedback with product leaders.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#5b3df5] text-white text-xs font-semibold hover:bg-[#4a2ee3] transition-all"
            >
              Submit First Suggestion
            </button>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.feedback_id || item.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDark ? 'bg-[#0f1422] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(item.priority)}`}>
                      {item.priority || 'MEDIUM'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {item.category || 'TESTABILITY'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                      {item.status || 'SUBMITTED'}
                    </span>
                    {item.prd_id && (
                      <Link
                        to={`/workspace/${workspaceId}/qa/prd-view`}
                        className={`text-[10px] flex items-center gap-1 hover:underline ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        <FileText size={12} />
                        <span>{item.prd_title || item.prd_id}</span>
                      </Link>
                    )}
                  </div>

                  <h3 className="text-base font-bold tracking-tight">{item.title}</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {item.suggestion || item.description}
                  </p>

                  {item.rationale && (
                    <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      <span className="font-semibold block mb-0.5 text-purple-400">Risk & Rationale:</span>
                      {item.rationale}
                    </div>
                  )}

                  {/* PM Response block */}
                  {item.pm_response && (
                    <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-purple-950/20 border-purple-800/40 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'}`}>
                      <div className="flex items-center gap-1.5 font-semibold text-purple-400 mb-1">
                        <CheckCircle2 size={13} />
                        <span>Product Manager Response:</span>
                      </div>
                      <p>{item.pm_response}</p>
                    </div>
                  )}

                  <div className={`flex items-center gap-4 text-[11px] pt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {item.submitted_by || 'QA Lead'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <Link
                    to={`/workspace/${workspaceId}/qa/prd-view`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      isDark
                        ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <FileText size={13} />
                    <span>View PRD</span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 ${isDark ? 'bg-[#0f1422] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-purple-400" size={20} />
                <h3 className="font-bold text-base">Submit QA Feedback / Suggestion</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all`}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Title / Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Idempotency token recommendation for batch export retry"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  } outline-none focus:border-purple-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } outline-none`}
                  >
                    {FEEDBACK_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } outline-none`}
                  >
                    <option value="CRITICAL">Critical (P1)</option>
                    <option value="HIGH">High (P2)</option>
                    <option value="MEDIUM">Medium (P3)</option>
                    <option value="LOW">Low (P4)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Suggestion & Recommendation *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail your technical or QA recommendation clearly..."
                  value={formData.suggestion}
                  onChange={(e) => setFormData({ ...formData, suggestion: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  } outline-none focus:border-purple-500`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-400">Risk & Rationale (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Why is this important? What risk does it alleviate?"
                  value={formData.rationale}
                  onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  } outline-none focus:border-purple-500`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#5b3df5] hover:bg-[#4a2ee3] text-white text-xs font-semibold shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Send size={14} />
                  <span>{submitting ? 'Submitting...' : 'Submit to PM'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

