import React, { useState, useEffect } from 'react';
import { Compass, Lightbulb, AlertTriangle, TrendingUp, Star, ChevronRight, MessageSquare } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { intelligenceApi } from '../../api/intelligence';

export default function QAProductContext() {
  const { workspaceId } = useParams();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      if (!workspaceId) return;
      setLoading(true);
      try {
        const res = await intelligenceApi.getInsights(workspaceId);
        setInsights(res || []);
      } catch (err) {
        console.warn('Failed to load product intelligence:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, [workspaceId]);

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Compass size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Product Context & Intelligence
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              Business Evidence
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Understand customer friction, root causes, and user feedback driving the requirements under test
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading product intelligence context...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb size={15} className="text-amber-400" />
              <span>Customer Evidence & Pain Points</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Customer telemetry revealed that 14.2% of cart abandonment occurs after a single card decline. Customers repeatedly tap 'Retry' without UI feedback, causing duplicated charge attempts and support tickets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-400" />
                <span>Primary Risk Focus</span>
              </h4>
              <p className="text-xs text-slate-300">
                Idempotency key collisions, charge duplication, and race conditions during rapid retries constitute the highest severity quality risks.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-400" />
                <span>Strategic Quality Goal</span>
              </h4>
              <p className="text-xs text-slate-300">
                Attain sub-200ms user feedback on fallback payment retry while completely preventing double billing on Staging and Production.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

