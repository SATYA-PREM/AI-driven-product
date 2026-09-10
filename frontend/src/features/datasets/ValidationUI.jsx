import { useOutletContext, useParams } from 'react-router-dom';

export default function ValidationUI() {
  const { workspaceId } = useParams();
  const { isDark } = useOutletContext();

  const cardBg = isDark ? 'bg-[#0a0a0a]/60 border-white/10' : 'bg-white/80 border-gray-200 shadow-sm';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const accentText = isDark ? 'text-[#00FFA3]' : 'text-blue-600';

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-widest uppercase mb-4 ${isDark ? 'bg-white/5 border-white/10 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Validation Complete
          </div>
          <h1 className={`text-3xl font-black tracking-tight ${textMain}`}>Data Quality Report</h1>
          <p className={`text-sm mt-2 font-medium ${textMuted}`}>Dataset: App Store Reviews_v3.csv</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-8 rounded-3xl border backdrop-blur-md md:col-span-2 ${cardBg}`}>
          <h2 className={`text-sm font-mono font-bold uppercase tracking-widest mb-6 ${textMuted}`}>Overall Quality Score</h2>
          <div className="flex items-end gap-4 mb-4">
            <span className={`text-6xl font-black ${textMain}`}>91<span className="text-3xl">%</span></span>
            <span className="text-emerald-500 font-bold text-sm mb-2">+4% from last batch</span>
          </div>
          <div className={`w-full rounded-full h-3 mb-6 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
            <div className={`h-3 rounded-full animate-[fill-bar_1.5s_ease-out_forwards] ${isDark ? 'bg-gradient-to-r from-[#00FFA3]/50 to-[#00FFA3]' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`} style={{ width: '91%' }}></div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t pt-6 mt-6 border-white/5">
            <div>
              <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${textMuted}`}>Valid Records</p>
              <p className={`text-xl font-bold mt-1 ${textMain}`}>11,850</p>
            </div>
            <div>
              <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${textMuted}`}>Invalid Records</p>
              <p className="text-xl font-bold mt-1 text-red-500">320</p>
            </div>
            <div>
              <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${textMuted}`}>Warnings</p>
              <p className="text-xl font-bold mt-1 text-yellow-500">280</p>
            </div>
          </div>
        </div>

        <div className={`p-8 rounded-3xl border backdrop-blur-md flex flex-col justify-center ${cardBg}`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <svg className={`w-8 h-8 ${accentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className={`text-lg font-bold mb-2 ${textMain}`}>Proceed to Processing?</h3>
          <p className={`text-xs mb-6 ${textMuted}`}>Data meets the 85% minimum threshold for Gemini AI analysis.</p>
          <button className={`w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02] ${isDark ? 'bg-[#00FFA3] text-black shadow-[0_0_20px_rgba(0,255,163,0.2)]' : 'bg-blue-600 text-white shadow-md'}`}>
            Initiate Pipeline
          </button>
        </div>
      </div>

      <div className={`rounded-3xl border backdrop-blur-md overflow-hidden ${cardBg}`}>
        <div className={`px-6 py-5 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
          <h2 className={`text-sm font-mono font-bold uppercase tracking-widest ${textMain}`}>Deterministic Rule Failures</h2>
        </div>
        <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
          <div className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
              <div>
                <p className={`font-bold text-sm ${textMain}`}>Missing <span className="font-mono">customer_id</span></p>
                <p className={`text-xs mt-1 ${textMuted}`}>Null values detected in primary key column</p>
              </div>
            </div>
            <span className="font-mono text-sm text-red-500 font-bold">120 records</span>
          </div>
          <div className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
              <div>
                <p className={`font-bold text-sm ${textMain}`}>Invalid <span className="font-mono">rating</span> range</p>
                <p className={`text-xs mt-1 ${textMuted}`}>Values must be between 1 and 5</p>
              </div>
            </div>
            <span className="font-mono text-sm text-red-500 font-bold">100 records</span>
          </div>
          <div className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
              <div>
                <p className={`font-bold text-sm ${textMain}`}>Duplicate text content</p>
                <p className={`text-xs mt-1 ${textMuted}`}>Identical reviews submitted by different users</p>
              </div>
            </div>
            <span className="font-mono text-sm text-yellow-500 font-bold">40 records</span>
          </div>
        </div>
      </div>
    </div>
  );
}