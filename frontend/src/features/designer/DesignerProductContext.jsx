import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Users,
  Target,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import { getSessionCache } from '../../api/core';

export default function DesignerProductContext() {
  const { workspaceId } = useParams();

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/designer/product-context` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [context, setContext] = useState(() => initialCache);
  const [loading, setLoading] = useState(() => !initialCache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workspaceId) return;
    const cached = getSessionCache(cacheKey);
    if (!cached && !context) {
      setLoading(true);
    }
    setError(null);
    designerApi.getProductContext(workspaceId)
      .then((res) => {
        if (res) setContext(res);
      })
      .catch((err) => {
        console.warn('Error loading product context:', err);
        if (!context) setError(err.message || 'Failed to load product context');
      })
      .finally(() => setLoading(false));

    const onCacheUpdate = (e) => {
      if (e.detail?.endpoint === cacheKey && e.detail?.data) {
        setContext(e.detail.data);
      }
    };
    window.addEventListener('cache_updated', onCacheUpdate);
    return () => window.removeEventListener('cache_updated', onCacheUpdate);
  }, [workspaceId]);

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <Compass size={20} className="text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Product Context & Strategy
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              UX Direction
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Strategic grounding, user personas, customer pain points, and high-level design objectives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg">
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading product context...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Target Audience & Core Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl space-y-2 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <Users size={15} />
                <span>Target Audience & User Personas</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {context?.target_audience || 'Enterprise Product Teams & End Users'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Design interfaces that accommodate both high-velocity power users requiring density and non-technical stakeholders requiring clarity and guided workflows.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl space-y-2 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Target size={15} />
                <span>Core Problem Statement</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {context?.core_problem_statement || 'Complex workflows leading to friction and delayed decision-making.'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every UX component must directly simplify user decision paths and provide real-time status feedback.
              </p>
            </div>
          </div>

          {/* Top Customer Pain Points Grounded in Intelligence */}
          <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <span>Top Customer Pain Points</span>
              </h3>
              <span className="text-xs text-slate-400">Derived from feedback analysis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {context?.top_customer_pain_points && context.top_customer_pain_points.map((pp, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/40 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-purple-400 font-bold">{pp.insight_id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      {pp.severity} Severity ({pp.affected_users}% impacted)
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{pp.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{pp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key User Journeys & Strategic Design Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Journeys */}
            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl space-y-3 shadow-lg">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" />
                <span>Key User Journeys to Optimize</span>
              </h3>
              <ul className="space-y-2.5">
                {context?.key_user_journeys && context.key_user_journeys.map((uj, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{uj}</span>
                    </div>
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Design Goals */}
            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl space-y-3 shadow-lg">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-400" />
                <span>Strategic Design Goals</span>
              </h3>
              <ul className="space-y-2.5">
                {context?.strategic_design_goals && context.strategic_design_goals.map((goal, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 flex items-start gap-2.5">
                    <span className="text-purple-400 font-bold mt-0.5">✦</span>
                    <span className="leading-snug">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
