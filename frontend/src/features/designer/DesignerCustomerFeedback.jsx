import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  Tag,
  Clock,
  User
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { designerApi } from '../../api/designer';

export default function DesignerCustomerFeedback() {
  const { workspaceId } = useParams();
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    designerApi.getCustomerFeedback(workspaceId)
      .then((res) => {
        setFeedbackItems(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        console.warn('Error loading customer feedback:', err);
        setError(err.message || 'Failed to load customer feedback');
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const filteredItems = useMemo(() => {
    return feedbackItems.filter((item) => {
      if (sentimentFilter !== 'ALL' && item.sentiment?.toLowerCase() !== sentimentFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title?.toLowerCase().includes(q) ||
          item.content?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [feedbackItems, sentimentFilter, searchQuery]);

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return <Smile size={14} className="text-emerald-400" />;
      case 'negative':
        return <Frown size={14} className="text-rose-400" />;
      default:
        return <Meh size={14} className="text-amber-400" />;
    }
  };

  const getSentimentBadge = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'negative':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 p-6 md:p-8 font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#141b2d]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <MessageSquare size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Customer Feedback & UX Signals
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              User Evidence
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Real customer pain points, sentiment patterns, and verbatim user quotes relevant to UI/UX decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-4 py-2 rounded-xl bg-[#121729] hover:bg-[#1a223c] border border-[#212c49] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0e1322] border border-[#1a233b] rounded-2xl p-4">
        
        {/* Sentiment Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {[
            { id: 'ALL', label: 'All Feedback' },
            { id: 'negative', label: 'Pain Points / Negative' },
            { id: 'neutral', label: 'Neutral / Suggestions' },
            { id: 'positive', label: 'Positive Experience' },
          ].map((tab) => {
            const isActive = sentimentFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSentimentFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#5b3df5] text-white shadow-md shadow-[#5b3df5]/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback content, tags..."
            className="w-full bg-[#121829] border border-[#212b45] rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] transition-colors"
          />
        </div>

      </div>

      {/* Feedback Feed */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#0e1322] border border-[#1a233b] rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-[#5b3df5] border-t-transparent animate-spin" />
          <span>Loading customer feedback...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#0e1322] border border-[#1a233b] rounded-2xl space-y-2">
          <MessageSquare size={36} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-300">No Feedback Matches</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            {searchQuery ? `No feedback items matching "${searchQuery}".` : 'No customer feedback available in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.feedback_id}
              className="p-5 rounded-2xl bg-[#0e1322] border border-[#1a233b] hover:border-[#2a375e] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded">
                    {item.feedback_id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 capitalize ${getSentimentBadge(item.sentiment)}`}>
                      {getSentimentIcon(item.sentiment)}
                      <span>{item.sentiment}</span>
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.ux_impact} UX Impact
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-white leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#12182a] p-3 rounded-xl border border-[#1e2744]">
                  "{item.content}"
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <User size={11} />
                  <span>{item.user_type}</span>
                </span>
                <span>{item.source}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

