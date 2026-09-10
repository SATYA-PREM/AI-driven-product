import { useOutletContext, useParams } from 'react-router-dom';

export default function Reports() {
  const { workspaceId } = useParams();
  const { isDark } = useOutletContext();

  const cardBg = isDark ? 'bg-[#0a0a0a]/60 border-white/10 backdrop-blur-3xl' : 'bg-white/80 border-gray-200 shadow-sm backdrop-blur-3xl';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const accentText = isDark ? 'text-[#00FFA3]' : 'text-blue-600';
  const accentBgSolid = isDark ? 'bg-[#00FFA3] text-black shadow-[0_0_20px_rgba(0,255,163,0.3)]' : 'bg-blue-600 text-white shadow-md';

  const reports = [
    { id: 'REP-08A', title: 'Weekly Product Summary', date: 'Aug 18 - Aug 25', status: 'READY', type: 'Executive' },
    { id: 'REP-08B', title: 'Development Progress', date: 'Sprint 14', status: 'GENERATING', type: 'Engineering' },
    { id: 'REP-08C', title: 'Sentiment & Issue Metrics', date: 'Q3 2026', status: 'FAILED', type: 'Intelligence' }
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-widest uppercase mb-4 ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Artifact Generation
          </div>
          <h1 className={`text-3xl font-black tracking-tight ${textMain}`}>System Reports</h1>
          <p className={`text-sm mt-2 font-medium ${textMuted}`}>Automated PDF summaries generated from AI intelligence and PM checkpoints.</p>
        </div>
        <button className={`px-6 py-3 rounded-xl font-mono text-[11px] font-bold tracking-widest uppercase transition-all hover:scale-105 flex items-center gap-2 ${accentBgSolid}`}>
          + Generate New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className={`p-6 rounded-3xl border flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${cardBg}`}>
            
            {report.status === 'GENERATING' && (
              <div className={`absolute top-0 left-0 w-full h-1 animate-data-flow ${isDark ? 'bg-[#00FFA3] shadow-[0_0_10px_#00FFA3]' : 'bg-blue-500 shadow-[0_0_10px_#2563EB]'}`}></div>
            )}

            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded border ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                {report.type}
              </span>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                report.status === 'READY' ? 'text-emerald-500' :
                report.status === 'GENERATING' ? (isDark ? 'text-[#00FFA3]' : 'text-blue-600') : 'text-red-500'
              }`}>
                {report.status === 'GENERATING' && <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-600'}`}></span>}
                {report.status}
              </span>
            </div>

            <h3 className={`text-lg font-bold mb-1 ${textMain}`}>{report.title}</h3>
            <p className={`text-xs font-mono mb-6 ${textMuted}`}>ID: {report.id} • {report.date}</p>

            <div className="mt-auto">
              {report.status === 'READY' && (
                <div className="flex gap-3">
                  <button className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>View Data</button>
                  <button className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-[#00FFA3]/20 hover:bg-[#00FFA3]/30 text-[#00FFA3]' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}>Download PDF</button>
                </div>
              )}
              {report.status === 'GENERATING' && (
                <div className={`w-full py-2.5 rounded-xl text-xs font-bold text-center border border-dashed ${isDark ? 'border-white/20 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                  Processing Context...
                </div>
              )}
              {report.status === 'FAILED' && (
                <button className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'}`}>
                  Retry Generation
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}