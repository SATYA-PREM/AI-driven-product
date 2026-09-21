import React, { useState } from 'react';
import {
  Download,
  X,
  ShoppingCart,
  MessageSquare,
  FileText,
  Map,
  Edit3,
  Send,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from './FeatureBadges';

export default function FeatureDetailsDrawer({
  feature,
  onClose,
  onOpenEdit,
  onSendToPrioritization,
  onLinkPrd,
  onAddToRoadmap,
  onTriggerToast,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, feedback, prd, roadmap

  if (!feature) return null;

  return (
    <div className="bg-[#0e1422]/95 border border-[#1a2338] rounded-xl p-4 flex flex-col justify-between shadow-2xl transition-all duration-200">
      <div className="space-y-3 text-[11px]">
        {/* Drawer Top Header */}
        <div className="flex items-center justify-between border-b border-[#1a2338] pb-2.5">
          <h3 className="text-[12px] font-bold text-white tracking-wide">Feature Details</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerToast(`Exported feature "${feature.name}"`)}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-[#151d30] px-2 py-0.5 rounded border border-[#232f48] cursor-pointer"
              title="Export feature"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Main Info Block */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-white leading-tight">{feature.name}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">{feature.desc}</p>
          </div>
        </div>

        {/* Sub-tabs: Overview | Related Feedback | PRD | Roadmap */}
        <div className="flex items-center gap-3 border-b border-[#1a2338] text-[10.5px] font-medium pt-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`pb-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'feedback'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Related Feedback ({feature.feedback_count})
          </button>
          <button
            onClick={() => setActiveTab('prd')}
            className={`pb-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'prd'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            PRD
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`pb-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'roadmap'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Roadmap
          </button>
        </div>

        {/* Sub-tab: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="divide-y divide-[#1a2338]/70 border-b border-[#1a2338] pb-1 text-slate-300">
              <div className="flex justify-between py-1.5 items-center">
                <span className="text-slate-400">Status</span>
                <StatusBadge value={feature.status} />
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="text-slate-400">Priority</span>
                <PriorityBadge value={feature.priority} />
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Category</span>
                <span className="text-slate-200 font-medium">{feature.category}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Users Impacted</span>
                <span className="font-semibold text-white font-mono">
                  {Number(feature.users_impacted).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Feedback Count</span>
                <span className="font-semibold text-white font-mono">{feature.feedback_count}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Source</span>
                <span className="text-slate-200 truncate max-w-[190px]">{feature.source}</span>
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="text-slate-400">Owner</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 text-[8px] font-bold flex items-center justify-center border border-indigo-500/30">
                    PS
                  </div>
                  <span className="text-slate-200 font-medium text-[10.5px]">{feature.owner}</span>
                </div>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Created On</span>
                <span className="text-slate-300 font-mono text-[10.5px]">{feature.created_on}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Last Updated</span>
                <span className="text-slate-300 font-mono text-[10.5px]">{feature.last_updated}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block mb-1">Description</span>
              <p className="text-[10.5px] text-slate-300 bg-[#121929] p-2.5 rounded-lg border border-[#1a2338] leading-relaxed">
                {feature.long_desc || feature.desc}
              </p>
            </div>
          </div>
        )}

        {/* Sub-tab: RELATED FEEDBACK */}
        {activeTab === 'feedback' && (
          <div className="space-y-2 animate-in fade-in duration-150 max-h-64 overflow-y-auto pr-1">
            <span className="text-[10px] text-slate-400 font-semibold block">Customer Feedback Evidence</span>
            {feature.top_feedback && feature.top_feedback.length > 0 ? (
              feature.top_feedback.map((fb, idx) => (
                <div key={idx} className="bg-[#121929] border border-[#1a2338] p-2 rounded-lg flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[#38bdf8] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-200 leading-snug">"{fb.text}"</div>
                    <div className="text-[8.5px] text-slate-500 mt-1 flex justify-between">
                      <span>{fb.date}</span>
                      <span className="text-slate-400">{fb.source || 'Customer Voice'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 text-[10px]">
                No individual customer quotes attached yet.
              </div>
            )}
          </div>
        )}

        {/* Sub-tab: PRD */}
        {activeTab === 'prd' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            <div className="bg-[#121929] border border-[#1a2338] p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-white">Product Requirements Document</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${feature.prd_linked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {feature.prd_linked ? 'Draft Attached' : 'Not Linked'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Synthesizes customer evidence into user stories, technical specs, and acceptance criteria for engineering.
              </p>
              <button
                onClick={onLinkPrd}
                className="w-full bg-[#1e2942] hover:bg-[#283759] text-white py-1.5 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3 h-3 text-indigo-400" />
                <span>{feature.prd_linked ? 'Open Linked PRD' : 'Generate & Link PRD'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Sub-tab: ROADMAP */}
        {activeTab === 'roadmap' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            <div className="bg-[#121929] border border-[#1a2338] p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-white">Development Roadmap</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                  {feature.roadmap_status || 'Planned'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Tracks release milestone, sprint assignments, and feature flag rollout schedules.
              </p>
              <button
                onClick={onAddToRoadmap}
                className="w-full bg-[#1e2942] hover:bg-[#283759] text-white py-1.5 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Map className="w-3 h-3 text-emerald-400" />
                <span>Schedule in Development Roadmap</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons matching media_1789984980715.jpg */}
      <div className="pt-3 border-t border-[#1a2338] space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenEdit}
            className="bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-lg py-2 text-[10.5px] font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Feature</span>
          </button>

          <button
            onClick={onSendToPrioritization}
            className="bg-[#151d30] hover:bg-[#1c2842] text-slate-200 border border-[#232f48] rounded-lg py-2 text-[10.5px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3 h-3 text-[#a855f7]" />
            <span>Send to Prioritization</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLinkPrd}
            className="flex-1 bg-[#121929] hover:bg-[#1a2338] text-slate-300 border border-[#1f2b45] rounded-lg py-1.5 text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3 h-3 text-slate-400" />
            <span>Link to PRD</span>
          </button>

          <button
            onClick={onAddToRoadmap}
            className="flex-1 bg-[#121929] hover:bg-[#1a2338] text-slate-300 border border-[#1f2b45] rounded-lg py-1.5 text-[10px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Map className="w-3 h-3 text-slate-400" />
            <span>Add to Roadmap</span>
          </button>

          <button
            onClick={() => onTriggerToast('More actions: Duplicate, Archive, Export JSON')}
            className="bg-[#121929] hover:bg-[#1a2338] text-slate-400 hover:text-white border border-[#1f2b45] rounded-lg px-2.5 py-1.5 text-[10px] transition-colors cursor-pointer"
          >
            ...
          </button>
        </div>
      </div>
    </div>
  );
}

