import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  PlusCircle,
  Clock,
  User,
  Smartphone,
  Tag,
  CheckCircle2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { SentimentBadge, StatusBadge, SourceBadge, PriorityBadge } from './FeedbackBadges';

export default function FeedbackDetailsModal({
  isOpen,
  onClose,
  feedback,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onStatusChange,
  onMapFeature,
  onAssignToMe,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, ai_analysis, features, activity

  if (!isOpen || !feedback) return null;

  const keyIssues = feedback.key_issues?.length
    ? feedback.key_issues
    : [
        'Slow checkout process',
        'Payment failure during peak load',
        'Multiple retries needed to complete purchase',
      ];

  const topics = feedback.topics?.length
    ? feedback.topics
    : ['checkout', 'payment', 'performance', 'error', 'slow', 'bug'];

  const suggestedFeature =
    feedback.suggested_feature ||
    feedback.mapped_feature_name ||
    'Improve checkout performance';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in duration-200 flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2338] bg-[#0a0f1d]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">Feedback Details</span>
            <span className="text-[10px] text-slate-500 font-mono">({feedback.feedback_id})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="flex items-center gap-1 text-[10.5px] text-slate-400 hover:text-white px-2 py-1 rounded bg-[#151d30] border border-[#232f48] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Previous</span>
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="flex items-center gap-1 text-[10.5px] text-slate-400 hover:text-white px-2 py-1 rounded bg-[#151d30] border border-[#232f48] disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Quick Status Action */}
            <select
              value={feedback.status}
              onChange={(e) => onStatusChange(feedback.feedback_id, e.target.value)}
              className="bg-[#151d30] border border-[#232f48] text-slate-200 text-[10.5px] px-2 py-1 rounded focus:outline-none cursor-pointer"
            >
              <option value="New">Status: New</option>
              <option value="In Review">Status: In Review</option>
              <option value="Resolved">Status: Resolved</option>
              <option value="Snoozed">Status: Snoozed</option>
            </select>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#151d30] cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Feedback Hero Card */}
          <div className="bg-[#11192b] border border-[#1d2a45] rounded-xl p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-indigo-400 font-mono">
                  {feedback.feedback_id}
                </span>
                <SentimentBadge sentiment={feedback.sentiment} />
                <PriorityBadge priority={feedback.priority} />
                <SourceBadge source={feedback.source} />
              </div>
              <span className="text-slate-400 text-[10.5px] font-mono">{feedback.date_str}</span>
            </div>

            {/* Prominent Quote */}
            <p className="text-slate-100 text-sm font-normal leading-relaxed italic bg-[#0a0f1d]/70 p-3 rounded-lg border-l-2 border-indigo-500">
              "{feedback.text}"
            </p>
          </div>

          {/* Sub-Tabs Bar */}
          <div className="flex items-center gap-4 border-b border-[#1a2338] text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('ai_analysis')}
              className={`pb-2 transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'ai_analysis'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AI Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`pb-2 transition-colors cursor-pointer ${
                activeTab === 'features'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Related Features
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-2 transition-colors cursor-pointer ${
                activeTab === 'activity'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Activity
            </button>
          </div>

          {/* Tab Content 1: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Feedback Information */}
              <div className="bg-[#11192b]/60 border border-[#1a2338] rounded-xl p-3.5 space-y-2">
                <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Feedback Information
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-[#1a2338]/60">
                    <span className="text-slate-400">Source:</span>
                    <span className="text-slate-200 font-medium">{feedback.source}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1a2338]/60">
                    <span className="text-slate-400">Category:</span>
                    <span className="text-slate-200 font-medium">{feedback.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1a2338]/60">
                    <span className="text-slate-400">Assigned To:</span>
                    <span className="text-indigo-300 font-medium">{feedback.assigned_to}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1a2338]/60">
                    <span className="text-slate-400">User ID:</span>
                    <span className="text-slate-300 font-mono">{feedback.user_id || 'anonymous'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1a2338]/60">
                    <span className="text-slate-400">Device Platform:</span>
                    <span className="text-slate-200">{feedback.device || 'Android'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">App Version:</span>
                    <span className="text-slate-200 font-mono">{feedback.app_version || 'v2.3.1'}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Quick Overview */}
              <div className="bg-[#11192b]/60 border border-[#1a2338] rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Synthesis</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                    Key friction detected around payment processing reliability and transaction latency during peak checkout.
                  </p>

                  <div className="bg-[#0a0f1d] border border-[#232f48] rounded-lg p-2.5 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Suggested Product Feature:
                    </span>
                    <span className="text-xs font-semibold text-white block">
                      {suggestedFeature}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onMapFeature(feedback.feedback_id, suggestedFeature)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2 rounded-lg text-xs font-semibold shadow-md cursor-pointer transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>
                    {feedback.mapped_feature_name ? 'Re-link Feature' : 'Create / Map Feature'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Tab Content 2: AI Analysis */}
          {activeTab === 'ai_analysis' && (
            <div className="space-y-4">
              {/* Key Issues Box */}
              <div className="bg-[#11192b]/60 border border-[#1a2338] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span>Key Issues Identified by AI</span>
                </h4>
                <ul className="space-y-1.5 text-[11px] text-slate-300 pl-3">
                  {keyIssues.map((issue, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Extracted Topics & Keywords */}
              <div className="bg-[#11192b]/60 border border-[#1a2338] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Extracted Topics & Intent Tags</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-[10.5px] font-mono bg-[#151d30] border border-[#232f48] text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Related Features */}
          {activeTab === 'features' && (
            <div className="bg-[#11192b]/60 border border-[#1a2338] rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mapped Product Feature</span>
              </h4>
              {feedback.mapped_feature_name ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0f1d] border border-emerald-500/30">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      {feedback.mapped_feature_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {feedback.mapped_feature_id}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Linked
                  </span>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <p>No product feature linked to this feedback yet.</p>
                  <button
                    onClick={() => onMapFeature(feedback.feedback_id, suggestedFeature)}
                    className="mt-2 text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
                  >
                    Convert feedback into a product feature &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Content 4: Activity */}
          {activeTab === 'activity' && (
            <div className="bg-[#11192b]/60 border border-[#1a2338] rounded-xl p-4 space-y-3 text-[11px]">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Feedback History & Audit Trail</span>
              </h4>
              <div className="space-y-2 border-l border-slate-700 ml-2 pl-3">
                <div className="relative">
                  <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-slate-400 text-[10px]">{feedback.date_str}</span>
                  <p className="text-slate-200">Feedback ingested from {feedback.source}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-400 text-[10px]">{feedback.date_str}</span>
                  <p className="text-slate-200">AI sentiment analysis tagged as {feedback.sentiment}</p>
                </div>
                {feedback.resolution_date && (
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-400 text-[10px]">{feedback.resolution_date}</span>
                    <p className="text-emerald-300">Feedback marked as Resolved</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

