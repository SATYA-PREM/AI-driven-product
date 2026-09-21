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
      iconBg: 'bg-[#2e1065]/60 border border-[#581c87]/50 text-[#c084fc]',
      trend: metrics?.total_vs_last_month || '↑ 12% vs last month',
      trendColor: 'text-[#4ade80]',
    },
    {
      title: 'Active Features',
      val: metrics?.active_features ?? 38,
      icon: ListFilter,
      iconBg: 'bg-[#1e3a8a]/40 border border-[#1d4ed8]/40 text-[#60a5fa]',
      trend: metrics?.active_vs_last_month || '↑ 8% vs last month',
      trendColor: 'text-[#4ade80]',
    },
    {
      title: 'Implemented',
      val: metrics?.implemented ?? 14,
      icon: CheckCircle2,
      iconBg: 'bg-[#064e3b]/50 border border-[#047857]/40 text-[#4ade80]',
      trend: metrics?.implemented_vs_last_month || '↑ 16% vs last month',
      trendColor: 'text-[#4ade80]',
    },
    {
      title: 'In Progress',
      val: metrics?.in_progress ?? 16,
      icon: Clock,
      iconBg: 'bg-[#78350f]/40 border border-[#b45309]/40 text-[#fbbf24]',
      trend: metrics?.in_progress_vs_last_month || '↑ 6% vs last month',
      trendColor: 'text-[#4ade80]',
    },
    {
      title: 'Planned',
      val: metrics?.planned ?? 12,
      icon: AlertTriangle,
      iconBg: 'bg-[#7f1d1d]/40 border border-[#b91c1c]/40 text-[#f87171]',
      trend: metrics?.planned_vs_last_month || '↓ 7% vs last month',
      trendColor: 'text-[#f87171]',
    },
    {
      title: 'Unique Users Impacted',
      val: (metrics?.unique_users_impacted ?? 24812).toLocaleString(),
      icon: Users,
      iconBg: 'bg-[#3b0764]/50 border border-[#6b21a8]/40 text-[#c084fc]',
      trend: metrics?.users_vs_last_month || '↑ 14% vs last month',
      trendColor: 'text-[#4ade80]',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const IconComp = card.icon;
        return (
          <div
            key={idx}
            className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-3 flex flex-col justify-between hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <IconComp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-[10.5px] text-slate-400 font-normal">{card.title}</div>
              <div className="text-[19px] font-bold text-white tracking-tight mt-0.5">{card.val}</div>
              <div className={`text-[9.5px] font-medium mt-0.5 ${card.trendColor}`}>{card.trend}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

