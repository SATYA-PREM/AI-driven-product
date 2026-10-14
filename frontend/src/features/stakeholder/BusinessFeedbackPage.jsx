import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';
import StakeholderFeedbackModal from './components/StakeholderFeedbackModal';

const CATEGORY_ICONS = {
  STRATEGIC_ALIGNMENT: Target,
  BUSINESS_VALUE: TrendingUp,
  MARKET_FIT: Sparkles,
  RISK_CONCERN: ShieldAlert,
  METRIC_VALIDATION: HelpCircle,
  TIMELINE_PRIORITY: Clock,
  OTHER: MessageSquare,
};

export default function BusinessFeedbackPage() {
  const { workspaceId } = useParams();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFeedback = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await stakeholderApi.listBusinessFeedback(workspaceId);
      setFeedbackList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load stakeholder feedback:', err);
      setError(err.message || 'Failed to fetch business feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [workspaceId]);

  const filteredList = feedbackList.filter((fb) => {
    const matchesSearch =
      fb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.rationale.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fb.target_title && fb.target_title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || fb.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <MessageSquare size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Business Feedback</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  PM Alignment & Decisions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured feedback, strategic concerns, and PM responses across PRDs, initiatives, and objectives
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all self-start lg:self-auto"
        >
          <Plus size={15} />
          <span>Submit New Feedback</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback by title, rationale, target..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'SUBMITTED', label: 'Submitted' },
            { id: 'ACKNOWLEDGED', label: 'Acknowledged' },
            { id: 'INCORPORATED', label: 'Incorporated' },
            { id: 'DECLINED', label: 'Declined' },
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

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center space-y-2">
            <MessageSquare size={36} className="mx-auto text-purple-400 opacity-60" />
            <div className="text-sm font-semibold text-white">No feedback records found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Submit your strategic recommendations, market evidence, or business concerns to initiate collaboration with the PM.
            </p>
          </div>
        ) : (
          filteredList.map((fb) => {
            const Icon = CATEGORY_ICONS[fb.category] || MessageSquare;
            return (
              <div
                key={fb.feedback_id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-500/40 transition-all space-y-3 shadow-lg shadow-black/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {fb.feedback_id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Icon size={11} />
                        <span>{fb.category?.replace(/_/g, ' ')}</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        fb.status === 'INCORPORATED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                        fb.status === 'ACKNOWLEDGED' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' :
                        fb.status === 'DECLINED' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                        'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {fb.status}
                      </span>
                      {fb.target_title && (
                        <span className="text-[11px] text-slate-400">
                          Target: <strong className="text-slate-300">{fb.target_title}</strong>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">{fb.title}</h3>
                  </div>

                  <div className="text-[11px] text-slate-400 shrink-0">
                    Submitted: {fb.created_at?.slice(0, 10)}
                  </div>
                </div>

                {/* Substantive Rationale & Actions */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Business Rationale</span>
                    <p className="text-slate-300 leading-relaxed mt-0.5">{fb.rationale}</p>
                  </div>

                  {fb.business_impact && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Expected Impact</span>
                      <p className="text-slate-300 mt-0.5">{fb.business_impact}</p>
                    </div>
                  )}

                  {fb.suggested_action && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-semibold text-purple-300 uppercase block">Suggested Alternative</span>
                      <p className="text-purple-200 mt-0.5">{fb.suggested_action}</p>
                    </div>
                  )}
                </div>

                {/* PM Response Section */}
                {fb.pm_response ? (
                  <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-purple-300">
                      <span className="font-semibold">PM Response by {fb.pm_response_by || 'Product Manager'}</span>
                      <span>{fb.pm_response_at?.slice(0, 10)}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{fb.pm_response}</p>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic pt-1">
                    Awaiting Product Manager review and response.
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <StakeholderFeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspaceId}
        onSuccess={fetchFeedback}
      />
    </div>
  );
}

