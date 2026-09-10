import { useOutletContext } from 'react-router-dom';

export default function PMValidation() {
  const { isDark } = useOutletContext();

  const cardBg = isDark ? 'bg-[#0a0a0a]/60 border-white/10 backdrop-blur-3xl' : 'bg-white/80 border-gray-200 shadow-sm backdrop-blur-3xl';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const accentText = isDark ? 'text-[#00FFA3]' : 'text-blue-600';

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-widest uppercase mb-4 ${isDark ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            Midway Review Pending
          </div>
          <h1 className={`text-3xl font-black tracking-tight ${textMain}`}>Checkpoint: Auth Logic</h1>
          <p className={`text-sm mt-2 font-medium ${textMuted}`}>Phase 2 • Submitted by Developer M1</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Evidence & Details */}
        <div className={`lg:col-span-2 p-8 rounded-3xl border ${cardBg}`}>
          <h2 className={`text-sm font-mono font-bold uppercase tracking-widest mb-6 ${textMain}`}>Submission Evidence</h2>
          
          <div className="space-y-4 mb-8">
            <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${isDark ? 'bg-black/50 border-white/5 hover:border-white/20' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                  <svg className={`w-5 h-5 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <div>
                  <p className={`font-bold text-sm ${textMain}`}>Pull Request #42</p>
                  <p className={`text-xs ${textMuted}`}>github.com/org/repo/pull/42</p>
                </div>
              </div>
              <button className={`text-xs font-bold ${accentText}`}>View PR</button>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${isDark ? 'bg-black/50 border-white/5 hover:border-white/20' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                  <svg className={`w-5 h-5 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className={`font-bold text-sm ${textMain}`}>UI Demo Recording</p>
                  <p className={`text-xs ${textMuted}`}>auth-demo-v1.mp4</p>
                </div>
              </div>
              <button className={`text-xs font-bold ${accentText}`}>Play</button>
            </div>
          </div>

          <h2 className={`text-sm font-mono font-bold uppercase tracking-widest mb-6 ${textMain}`}>Acceptance Criteria</h2>
          <div className="space-y-3">
            {['Login screen layout matches Figma', 'Form validation (Email format, Password strength)', 'API integration with /auth/login', 'JWT stored securely in HTTP-only cookie'].map((criterion, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 ${idx < 2 ? (isDark ? 'bg-[#00FFA3]/20 border-[#00FFA3] text-[#00FFA3]' : 'bg-blue-100 border-blue-500 text-blue-600') : (isDark ? 'bg-black/50 border-white/20 text-transparent' : 'bg-white border-gray-300 text-transparent')}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className={`text-sm ${idx < 2 ? textMain : textMuted}`}>{criterion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        <div className={`p-8 rounded-3xl border flex flex-col ${cardBg}`}>
          <h2 className={`text-sm font-mono font-bold uppercase tracking-widest mb-2 ${textMain}`}>PM Decision</h2>
          <p className={`text-xs mb-8 ${textMuted}`}>As the Product Manager, you hold the authority to approve this checkpoint or request rework.</p>

          <div className="space-y-4 mt-auto">
            <button className={`w-full py-4 rounded-xl font-mono text-[11px] font-bold tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${isDark ? 'bg-[#00FFA3] text-black hover:shadow-[0_0_20px_rgba(0,255,163,0.3)]' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              Approve Checkpoint
            </button>
            
            <button className={`w-full py-4 rounded-xl font-mono text-[11px] font-bold tracking-widest uppercase transition-all flex justify-center items-center gap-2 border ${isDark ? 'bg-black/50 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10' : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Request Changes
            </button>
            
            <button className={`w-full py-4 rounded-xl font-mono text-[11px] font-bold tracking-widest uppercase transition-all flex justify-center items-center gap-2 border ${isDark ? 'bg-black/50 border-red-500/50 text-red-400 hover:bg-red-500/10' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Block Pipeline
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}