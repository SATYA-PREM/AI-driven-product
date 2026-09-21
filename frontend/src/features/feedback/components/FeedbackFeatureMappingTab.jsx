import React, { useState } from 'react';
import { Layers, Link2, PlusCircle, CheckCircle } from 'lucide-react';
import { SourceBadge } from './FeedbackBadges';

export default function FeedbackFeatureMappingTab({
  feedbackList = [],
  onSelectFeedback,
  onMapFeature,
}) {
  const [subTab, setSubTab] = useState('mapped'); // mapped, unmapped

  const mappedList = feedbackList.filter(
    (f) => f.mapped_feature_id || f.mapped_feature_name
  );
  const unmappedList = feedbackList.filter(
    (f) => !f.mapped_feature_id && !f.mapped_feature_name
  );

  const currentList = subTab === 'mapped' ? mappedList : unmappedList;

  return (
    <div className="space-y-4">
      {/* Sub-tab Pill Switcher */}
      <div className="flex items-center justify-between bg-[#0e1422] border border-[#1a2338] rounded-xl p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('mapped')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              subTab === 'mapped'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-[#151d30]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Mapped ({mappedList.length})</span>
          </button>

          <button
            onClick={() => setSubTab('unmapped')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              subTab === 'unmapped'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-[#151d30]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Unmapped ({unmappedList.length})</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 hidden sm:block">
          See how raw customer feedback items are synthesized and converted into features.
        </p>
      </div>

      {/* Mapping Table */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#11192b] text-slate-400 text-[10.5px] border-b border-[#1a2338]">
              <tr>
                <th className="px-3.5 py-2.5 font-medium w-24">Feedback ID</th>
                <th className="px-3 py-2.5 font-medium">Feedback</th>
                <th className="px-3 py-2.5 font-medium w-48">Source</th>
                <th className="px-3 py-2.5 font-medium">Mapped Feature</th>
                <th className="px-3 py-2.5 font-medium w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2338]/60 text-[11px]">
              {currentList.length > 0 ? (
                currentList.map((item) => (
                  <tr
                    key={item.feedback_id}
                    onClick={() => onSelectFeedback(item)}
                    className="hover:bg-[#151d30]/70 cursor-pointer transition-colors group"
                  >
                    <td className="px-3.5 py-2.5 font-mono text-[10.5px] text-indigo-400 font-semibold group-hover:underline">
                      {item.feedback_id}
                    </td>
                    <td className="px-3 py-2.5 text-slate-200 pr-4 font-normal max-w-sm truncate">
                      {item.text}
                    </td>
                    <td className="px-3 py-2.5">
                      <SourceBadge source={item.source} />
                    </td>
                    <td className="px-3 py-2.5">
                      {item.mapped_feature_name ? (
                        <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                          <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{item.mapped_feature_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not mapped to any feature yet</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      {item.mapped_feature_name ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          <span>Linked</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onMapFeature(item.feedback_id, item.suggested_feature || item.text.slice(0, 35))}
                          className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-white bg-indigo-600/20 hover:bg-indigo-600 px-2 py-1 rounded-md border border-indigo-500/40 transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Link Feature</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-500 text-xs">
                    No feedback found in this tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

