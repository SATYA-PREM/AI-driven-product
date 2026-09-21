import React from 'react';
import { MoreVertical } from 'lucide-react';
import { PriorityBadge, StatusBadge } from './FeatureBadges';

export default function FeatureTable({
  features,
  loading,
  selectedFeature,
  onSelectFeature,
  selectedRows,
  onToggleRow,
  selectAll,
  onToggleSelectAll,
  totalFeatures = 56,
}) {
  return (
    <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl overflow-hidden flex flex-col justify-between shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead className="bg-[#11192b] text-slate-400 border-b border-[#1a2338]">
            <tr>
              <th className="w-10 px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={onToggleSelectAll}
                  className="rounded bg-[#151d30] border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="px-3 py-2.5 font-medium">Feature Name</th>
              <th className="px-3 py-2.5 font-medium">Category</th>
              <th className="px-3 py-2.5 font-medium">Priority</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Users Impacted</th>
              <th className="px-3 py-2.5 font-medium">Feedback</th>
              <th className="px-3 py-2.5 font-medium">Created On</th>
              <th className="px-3 py-2.5 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2338]/70">
            {features.length > 0 ? (
              features.map((row) => {
                const isSelected = selectedFeature?.feature_id === row.feature_id;
                const isChecked = selectedRows.has(row.feature_id);

                return (
                  <tr
                    key={row.feature_id}
                    onClick={() => onSelectFeature(row)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#151f33] border-l-2 border-indigo-500'
                        : 'hover:bg-[#121929]'
                    }`}
                  >
                    <td
                      className="px-3 py-2.5 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRow(row.feature_id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleRow(row.feature_id)}
                        className="rounded bg-[#151d30] border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-white text-[11.5px] leading-tight">
                        {row.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 max-w-[220px] truncate">
                        {row.desc}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 font-normal">{row.category}</td>
                    <td className="px-3 py-2.5">
                      <PriorityBadge value={row.priority} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-200 font-mono font-medium">
                      {Number(row.users_impacted).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 font-mono font-medium">
                      {row.feedback_count}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 font-mono text-[10px]">
                      {row.created_on}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-500 hover:text-slate-300">
                      <MoreVertical className="w-3.5 h-3.5 inline cursor-pointer" />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-8 text-slate-500 text-[11px]">
                  {loading ? 'Loading features...' : 'No features found matching the filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="p-3 border-t border-[#1a2338] text-[10px] text-slate-400 bg-[#0a0f1a] flex flex-wrap justify-between items-center gap-2">
        <span>Showing 1 to {Math.min(features.length, 10)} of {totalFeatures} features</span>

        <div className="flex items-center gap-1.5">
          <button className="px-2 py-0.5 rounded bg-[#151d30] hover:bg-[#1a2338] text-slate-300 disabled:opacity-50">
            &lt;
          </button>
          <button className="px-2.5 py-0.5 rounded bg-[#6366f1] text-white font-medium">1</button>
          <button className="px-2.5 py-0.5 rounded hover:bg-[#151d30] text-slate-300">2</button>
          <button className="px-2.5 py-0.5 rounded hover:bg-[#151d30] text-slate-300">3</button>
          <button className="px-2.5 py-0.5 rounded hover:bg-[#151d30] text-slate-300">4</button>
          <button className="px-2.5 py-0.5 rounded hover:bg-[#151d30] text-slate-300">5</button>
          <button className="px-2.5 py-0.5 rounded hover:bg-[#151d30] text-slate-300">6</button>
          <button className="px-2 py-0.5 rounded bg-[#151d30] hover:bg-[#1a2338] text-slate-300">
            &gt;
          </button>
        </div>

        <div className="flex items-center gap-1">
          <select className="bg-[#151d30] border border-[#232f48] px-2 py-0.5 rounded text-[10px] text-slate-300 focus:outline-none">
            <option>10 / page</option>
            <option>25 / page</option>
            <option>50 / page</option>
          </select>
        </div>
      </div>
    </div>
  );
}

