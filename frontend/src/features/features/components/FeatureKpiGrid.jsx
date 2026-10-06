import React from 'react';
import {
  Layers,
  ListFilter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
} from 'lucide-react';

export default function FeatureKpiGrid({ metrics }) {
  const cards = [
    {
      title: 'Total Features',
      val: metrics?.total_features ?? 56,
      icon: Layers,
      iconBg: 'bg-purple-500/15 border border-purple-500/30 text-purple-400',
      trend: metrics?.total_vs_last_month || '↑ 12% vs last month',
      trendColor: 'text-emerald-400',
    },
    {
      title: 'Active Features',
      val: metrics?.active_features ?? 38,
      icon: ListFilter,
      iconBg: 'bg-blue-500/15 border border-blue-500/30 text-blue-400',
      trend: metrics?.active_vs_last_month || '↑ 8% vs last month',
      trendColor: 'text-emerald-400',
    },
    {
      title: 'Implemented',
      val: metrics?.implemented ?? 14,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400',
      trend: metrics?.implemented_vs_last_month || '↑ 16% vs last month',
      trendColor: 'text-emerald-400',
    },
    {
      title: 'In Progress',
      val: metrics?.in_progress ?? 16,
      icon: Clock,
      iconBg: 'bg-amber-500/15 border border-amber-500/30 text-amber-400',
      trend: metrics?.in_progress_vs_last_month || '↑ 6% vs last month',
      trendColor: 'text-emerald-400',
    },
    {
      title: 'Planned',
      val: metrics?.planned ?? 12,
      icon: AlertTriangle,
      iconBg: 'bg-rose-500/15 border border-rose-500/30 text-rose-400',
      trend: metrics?.planned_vs_last_month || '↓ 7% vs last month',
      trendColor: 'text-rose-400',
    },
    {
      title: 'Users Impacted',
      val: (metrics?.unique_users_impacted ?? 24812).toLocaleString(),
      icon: Users,
      iconBg: 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400',
      trend: metrics?.users_vs_last_month || '↑ 14% vs last month',
      trendColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const IconComp = card.icon;
        return (
          <div
            key={idx}
            className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-3.5 flex flex-col justify-between hover:border-purple-500/40 transition-colors shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <IconComp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-[11px] text-slate-400 font-medium">{card.title}</div>
              <div className="text-[20px] font-bold text-white tracking-tight mt-0.5 leading-none">{card.val}</div>
              <div className={`text-[10px] font-medium mt-1.5 ${card.trendColor}`}>{card.trend}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
