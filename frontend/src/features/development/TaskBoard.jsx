import { useOutletContext } from 'react-router-dom';

export default function TaskBoard() {
  const { isDark } = useOutletContext();

  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  
  const columns = [
    { title: 'TODO', count: 3, color: isDark ? 'bg-white/5' : 'bg-gray-100', dot: 'bg-gray-500' },
    { title: 'IN PROGRESS', count: 2, color: isDark ? 'bg-blue-500/10' : 'bg-blue-50', dot: 'bg-blue-500' },
    { title: 'CHECKPOINT REVIEW', count: 1, color: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50', dot: 'bg-yellow-500' },
    { title: 'DONE', count: 4, color: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50', dot: 'bg-emerald-500' }
  ];

  const TaskCard = ({ title, priority, assignee, id }) => (
    <div className={`p-4 rounded-xl border mb-3 cursor-grab transition-all hover:scale-[1.02] ${isDark ? 'bg-[#111] border-white/10 hover:border-white/30' : 'bg-white border-gray-200 hover:border-gray-400 shadow-sm'}`}>
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[9px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border ${
          priority === 'P1' ? (isDark ? 'text-red-400 border-red-400/30 bg-red-400/10' : 'text-red-600 border-red-200 bg-red-50') :
          priority === 'P2' ? (isDark ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' : 'text-yellow-600 border-yellow-200 bg-yellow-50') :
          (isDark ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' : 'text-blue-600 border-blue-200 bg-blue-50')
        }`}>{priority}</span>
        <span className={`text-[10px] font-mono ${textMuted}`}>{id}</span>
      </div>
      <h3 className={`text-sm font-bold mb-4 leading-relaxed ${textMain}`}>{title}</h3>
      <div className="flex justify-between items-center mt-auto">
        <div className="flex -space-x-2">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-black ${isDark ? 'bg-gray-800 border-[#111] text-white' : 'bg-gray-200 border-white text-gray-700'}`}>
            {assignee}
          </div>
        </div>
        <svg className={`w-4 h-4 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${textMain}`}>Task Board</h1>
          <p className={`text-sm mt-2 font-medium ${textMuted}`}>Phase 2: Semantic AI Integration</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {columns.map((col, idx) => (
          <div key={idx} className={`w-[320px] shrink-0 rounded-3xl p-4 flex flex-col ${isDark ? 'bg-black/40 border border-white/5' : 'bg-gray-50/80 border border-gray-200'}`}>
            
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.dot}`}></div>
                <h3 className={`text-[10px] font-mono font-bold tracking-widest uppercase ${textMain}`}>{col.title}</h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'}`}>{col.count}</span>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {col.title === 'TODO' && (
                <>
                  <TaskCard title="Build Dataset Upload UI" priority="P1" assignee="M4" id="TSK-21" />
                  <TaskCard title="Implement RBAC Middleware" priority="P1" assignee="M1" id="TSK-22" />
                  <TaskCard title="Setup FastAPI Error Handlers" priority="P2" assignee="M1" id="TSK-23" />
                </>
              )}
              {col.title === 'IN PROGRESS' && (
                <>
                  <TaskCard title="Integrate Gemini REST API" priority="P1" assignee="M4" id="TSK-19" />
                  <TaskCard title="Dashboard Layout (Glassmorphism)" priority="P2" assignee="M4" id="TSK-20" />
                </>
              )}
              {col.title === 'CHECKPOINT REVIEW' && (
                <div className="relative group">
                  <div className={`absolute -inset-0.5 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 ${isDark ? 'bg-yellow-500' : 'bg-yellow-400'}`}></div>
                  <div className="relative">
                    <TaskCard title="Auth Logic & JWT Verification" priority="P1" assignee="M1" id="TSK-18" />
                  </div>
                </div>
              )}
              {col.title === 'DONE' && (
                <>
                  <TaskCard title="Database Schema Design" priority="P1" assignee="M1" id="TSK-15" />
                  <TaskCard title="Initialize React Router" priority="P2" assignee="M4" id="TSK-16" />
                  <TaskCard title="Mock Data Pipeline" priority="P3" assignee="M4" id="TSK-17" />
                </>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}