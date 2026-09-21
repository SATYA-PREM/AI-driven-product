import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { ChevronDown } from 'lucide-react';

const COLORS = {
  purple: '#8b5cf6',
  green: '#22c55e',
  blue: '#3b82f6',
  orange: '#f97316',
  amber: '#eab308',
  red: '#ef4444',
  slate: '#64748b',
};

export default function FeatureChartsRow({
  trendData,
  statusChartData,
  priorityChartData,
  totalFeatures = 56,
  onViewAllStatus,
  onViewAllPriority,
  onTimespanChange,
}) {
  const [timespan, setTimespan] = useState('Monthly');

  const handleTimespan = () => {
    const next = timespan === 'Monthly' ? 'Weekly' : timespan === 'Weekly' ? 'Daily' : 'Monthly';
    setTimespan(next);
    if (onTimespanChange) onTimespanChange(next);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Chart 1: Feature Trend Over Time */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-3.5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[12px] font-semibold text-white">Feature Trend Over Time</h3>
            <button
              onClick={handleTimespan}
              className="flex items-center gap-1 bg-[#151d30] border border-[#232f48] px-2 py-0.5 rounded text-[10px] text-slate-300 hover:border-slate-500 cursor-pointer"
            >
              <span>{timespan}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-3 text-[9.5px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              Total
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              Implemented
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
              In Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f97316]" />
              Planned
            </span>
          </div>
        </div>

        <div className="h-[150px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="#1a2338" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 50]} ticks={[0, 10, 20, 30, 40, 50]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0e1422',
                  borderColor: '#232f48',
                  borderRadius: '6px',
                  fontSize: '10px',
                  padding: '5px 8px',
                }}
              />
              <Line type="monotone" dataKey="total" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="implemented" stroke={COLORS.green} strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="inProgress" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="planned" stroke={COLORS.orange} strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Features by Status */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-3.5 flex flex-col justify-between">
        <h3 className="text-[12px] font-semibold text-white mb-1">Features by Status</h3>

        <div className="flex items-center justify-around py-1">
          <div className="w-[110px] h-[110px] relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  innerRadius={36}
                  outerRadius={52}
                  dataKey="count"
                  stroke="#0e1422"
                  strokeWidth={2}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[15px] font-bold text-white leading-none">{totalFeatures}</span>
              <span className="text-[8.5px] text-slate-400 mt-0.5">Total</span>
            </div>
          </div>

          <div className="space-y-1 pl-2 text-[10px]">
            {statusChartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-[2px]" style={{ background: item.color }} />
                  {item.name}
                </span>
                <span className="text-slate-400 font-mono text-[9.5px]">
                  <span className="text-slate-200 font-semibold">{item.count}</span> ({item.percentage})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-1.5 border-t border-[#1a2338]/80 flex justify-between items-center text-[10px]">
          <button
            onClick={onViewAllStatus}
            className="text-[#a855f7] hover:text-[#c084fc] font-medium transition-colors cursor-pointer"
          >
            View all features by status &rarr;
          </button>
        </div>
      </div>

      {/* Chart 3: Features by Priority */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-3.5 flex flex-col justify-between">
        <h3 className="text-[12px] font-semibold text-white mb-1">Features by Priority</h3>

        <div className="flex items-center justify-around py-1">
          <div className="w-[110px] h-[110px] relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  innerRadius={36}
                  outerRadius={52}
                  dataKey="count"
                  stroke="#0e1422"
                  strokeWidth={2}
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`priority-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[15px] font-bold text-white leading-none">{totalFeatures}</span>
              <span className="text-[8.5px] text-slate-400 mt-0.5">Total</span>
            </div>
          </div>

          <div className="space-y-1 pl-2 text-[10px]">
            {priorityChartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-[2px]" style={{ background: item.color }} />
                  {item.name}
                </span>
                <span className="text-slate-400 font-mono text-[9.5px]">
                  <span className="text-slate-200 font-semibold">{item.count}</span> ({item.percentage})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-1.5 border-t border-[#1a2338]/80 flex justify-between items-center text-[10px]">
          <button
            onClick={onViewAllPriority}
            className="text-[#a855f7] hover:text-[#c084fc] font-medium transition-colors cursor-pointer"
          >
            View all features by priority &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

