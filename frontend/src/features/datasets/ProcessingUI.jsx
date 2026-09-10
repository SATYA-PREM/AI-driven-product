import { useOutletContext, useParams } from 'react-router-dom';

export default function ProcessingUI() {
  const { workspaceId } = useParams();
  const { isDark } = useOutletContext();

  const cardBg = isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-gray-200 shadow-sm';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const accentText = isDark ? 'text-[#00FFA3]' : 'text-blue-600';

  const pipeline = [
    { name: "Raw Data Uploaded", status: "COMPLETED" },
    { name: "Deterministic Validation", status: "COMPLETED" },
    { name: "Data Cleaning", status: "COMPLETED" },
    { name: "Text Preprocessing", status: "COMPLETED" },
    { name: "Semantic AI Analysis", status: "RUNNING" },
    { name: "Intelligence Aggregation", status: "PENDING" }
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      <div className={`p-8 rounded-3xl border backdrop-blur-md relative overflow-hidden ${cardBg}`}>
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-20 pointer-events-none ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-500'}`}></div>
        
        <div className="relative z-10 text-center max-w-2xl mx-auto py-8">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-widest uppercase mb-6 ${isDark ? 'bg-white/10 border-white/20 text-[#00FFA3]' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
            <span className={`w-2 h-2 rounded-full animate-ping ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-600'}`}></span>
            System Processing
          </div>
          
          <h1 className={`text-4xl font-black tracking-tight mb-4 ${textMain}`}>
            Analyzing 11,850 Records
          </h1>
          <p className={`text-sm mb-10 ${textMuted}`}>
            The AI engine is currently extracting sentiment and grouping critical issues. Please wait while we generate your product intelligence dashboard.
          </p>

          <div className="mb-4 flex justify-between text-xs font-bold uppercase tracking-widest font-mono">
            <span className={textMuted}>Batch 8 of 20</span>
            <span className={accentText}>72%</span>
          </div>
          <div className={`w-full rounded-full h-2 mb-2 overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
            <div className={`h-full rounded-full animate-[fill-bar_2s_ease-out_forwards] ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-600'}`} style={{ width: '72%' }}></div>
          </div>
          <p className={`text-xs font-mono ${textMuted}`}>Estimated time remaining: 02m 45s</p>
        </div>
      </div>

      <div className={`p-8 rounded-3xl border backdrop-blur-md ${cardBg}`}>
        <h2 className={`text-sm font-mono font-bold uppercase tracking-widest mb-8 ${textMain}`}>Pipeline Status</h2>
        
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white/20 before:to-transparent">
          {pipeline.map((step, idx) => (
            <div key={idx} className="relative flex items-center gap-6 group">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full border-2 shrink-0 z-10 transition-colors ${
                step.status === 'COMPLETED' ? (isDark ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-emerald-500 border-emerald-500 text-white') :
                step.status === 'RUNNING' ? (isDark ? 'bg-black border-[#00FFA3]' : 'bg-white border-blue-500') :
                (isDark ? 'bg-black border-white/20' : 'bg-gray-50 border-gray-300')
              }`}>
                {step.status === 'COMPLETED' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                )}
                {step.status === 'RUNNING' && (
                  <div className={`w-3 h-3 rounded-full animate-pulse ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-500'}`}></div>
                )}
              </div>
              <div>
                <p className={`font-bold text-sm ${textMain} ${step.status === 'PENDING' && 'opacity-50'}`}>{step.name}</p>
                <p className={`text-[10px] font-mono uppercase tracking-widest mt-1 ${
                  step.status === 'COMPLETED' ? 'text-emerald-500' :
                  step.status === 'RUNNING' ? accentText : textMuted
                }`}>{step.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}