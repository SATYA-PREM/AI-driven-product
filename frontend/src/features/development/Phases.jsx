import { useOutletContext, Link, useParams } from 'react-router-dom';

export default function Phases() {
  const { workspaceId } = useParams();
  const { isDark } = useOutletContext();

  const cardBg = isDark ? 'bg-[#0a0a0a]/60 border-white/10 backdrop-blur-3xl' : 'bg-white/80 border-gray-200 shadow-sm backdrop-blur-3xl';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const accentText = isDark ? 'text-[#00FFA3]' : 'text-blue-600';
  const accentBgSolid = isDark ? 'bg-[#00FFA3] text-black shadow-[0_0_20px_rgba(0,255,163,0.3)]' : 'bg-blue-600 text-white shadow-md';

  const phases = [
    { id: 'PH-1', name: 'Foundation Data Pipeline', status: 'COMPLETED', progress: 100, tasks: 12 },
    { id: 'PH-2', name: 'Semantic AI Integration', status: 'IN_PROGRESS', progress: 72, tasks: 8 },
    { id: 'PH-3', name: 'Intelligence Dashboard UI', status: 'PLANNED', progress: 0, tasks: 15 },
    { id: 'PH-4', name: 'Automated PRD Generation', status: 'PLANNED', progress: 0, tasks: 6 }
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-widest uppercase mb-4 ${isDark ? 'bg-white/5 border-white/10 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
            <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-purple-500' : 'bg-purple-600'} animate-pulse`}></span>
            Agile Sprints
          </div>
          <h1 className={`text-3xl font-black tracking-tight ${textMain}`}>Development Phases</h1>
          <p className={`text-sm mt-2 font-medium ${textMuted}`}>AI-generated execution sprints based on product intelligence.</p>
        </div>
        <button className={`px-6 py-3 rounded-xl font-mono text-[11px] font-bold tracking-widest uppercase transition-all hover:scale-105 flex items-center gap-2 ${accentBgSolid}`}>
          + Create Custom Phase
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {phases.map((phase, idx) => (
          <div key={phase.id} className={`p-8 rounded-3xl border overflow-hidden relative group transition-all duration-300 hover:scale-[1.01] ${cardBg}`}>
            {phase.status === 'IN_PROGRESS' && (
              <div className={`absolute top-0 right-0 w-64 h-64 blur-[120px] opacity-20 pointer-events-none ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-500'}`}></div>
            )}
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              
              <div className="flex-1 w-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-1 rounded border ${
                    phase.status === 'COMPLETED' ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200') :
                    phase.status === 'IN_PROGRESS' ? (isDark ? 'bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20' : 'bg-blue-50 text-blue-700 border-blue-200') :
                    (isDark ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-gray-100 text-gray-500 border-gray-200')
                  }`}>
                    {phase.status.replace('_', ' ')}
                  </span>
                  <span className={`text-xs font-mono font-bold ${textMuted}`}>{phase.id}</span>
                </div>
                
                <h2 className={`text-2xl font-black tracking-tight mb-2 ${textMain}`}>{phase.name}</h2>
                <p className={`text-sm ${textMuted}`}>Phase {idx + 1} objective mapped directly from semantic intelligence output.</p>
                
                <div className="mt-6 flex gap-4">
                  <Link to={`/workspace/${workspaceId}/development/tasks`} className={`text-xs font-bold transition-colors ${isDark ? 'text-[#00FFA3] hover:text-white' : 'text-blue-600 hover:text-black'}`}>
                    View Board →
                  </Link>
                  <Link to={`/workspace/${workspaceId}/development/validation`} className={`text-xs font-bold transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
                    PM Checkpoints →
                  </Link>
                </div>
              </div>

              <div className={`w-full md:w-64 shrink-0 p-6 rounded-2xl border flex flex-col items-center justify-center ${isDark ? 'bg-black/50 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <span className={`text-4xl font-black mb-1 ${textMain}`}>{phase.progress}%</span>
                <span className={`text-[10px] font-mono font-bold tracking-widest uppercase mb-4 ${textMuted}`}>Completion</span>
                
                <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-1000 ${
                      phase.progress === 100 ? 'bg-emerald-500' : 
                      phase.progress > 0 ? (isDark ? 'bg-[#00FFA3]' : 'bg-blue-600') : 'bg-transparent'
                    }`} 
                    style={{ width: `${phase.progress}%` }}
                  ></div>
                </div>
                <div className={`mt-4 w-full flex justify-between text-xs font-bold ${textMuted}`}>
                  <span>{phase.tasks} Tasks</span>
                  <span>{Math.round(phase.tasks * (phase.progress/100))} Done</span>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}