import { useOutletContext } from 'react-router-dom';

export default function Trends() {
  const { isDark } = useOutletContext();

  const cardBg = isDark ? 'bg-black/40 border-white/10 backdrop-blur-3xl' : 'bg-white/80 border-gray-200 shadow-sm backdrop-blur-3xl';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  // Mock data for the graph
  const trendData = [
    { label: 'W1', issues: 65, demands: 20 },
    { label: 'W2', issues: 59, demands: 35 },
    { label: 'W3', issues: 80, demands: 40 },
    { label: 'W4', issues: 45, demands: 60 },
    { label: 'W5', issues: 30, demands: 85 },
    { label: 'W6', issues: 15, demands: 100 },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${textMain}`}>Dataset Output Graphs</h1>
          <p className={`text-sm mt-2 font-medium ${textMuted}`}>Visualizing feature demands vs critical issues over time.</p>
        </div>
      </div>

      <div className={`p-8 rounded-3xl border overflow-hidden relative ${cardBg}`}>
        <div className={`absolute top-0 right-0 w-96 h-96 blur-[120px] opacity-10 pointer-events-none ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-500'}`}></div>
        
        <div className="flex items-center justify-between mb-12 relative z-10">
          <h2 className={`text-sm font-mono font-bold uppercase tracking-widest ${textMain}`}>6-Week Trajectory</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className={`text-xs font-mono font-bold uppercase ${textMuted}`}>Critical Issues</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-600'}`}></div>
              <span className={`text-xs font-mono font-bold uppercase ${textMuted}`}>Feature Demands</span>
            </div>
          </div>
        </div>

        {/* Pure CSS Bar Graph */}
        <div className="h-72 w-full flex items-end justify-between gap-2 md:gap-6 relative z-10 border-b border-l pb-4 pl-4 border-dashed border-gray-500/30">
          {/* Y-Axis Labels */}
          <div className={`absolute -left-6 top-0 h-full flex flex-col justify-between text-[10px] font-mono ${textMuted}`}>
            <span>100</span><span>75</span><span>50</span><span>25</span>
          </div>

          {trendData.map((data, idx) => (
            <div key={idx} className="flex-1 flex justify-center items-end gap-1 md:gap-3 h-full group">
              {/* Issues Bar */}
              <div className="w-1/3 bg-red-500/80 rounded-t-sm relative transition-all duration-500 group-hover:bg-red-400 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-fade-in-up" style={{ height: `${data.issues}%`, animationDelay: `${idx * 100}ms` }}>
                <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${textMain}`}>{data.issues}</span>
              </div>
              {/* Demands Bar */}
              <div className={`w-1/3 rounded-t-sm relative transition-all duration-500 group-hover:shadow-[0_0_15px_rgba(0,255,163,0.5)] animate-fade-in-up ${isDark ? 'bg-[#00FFA3]/80 group-hover:bg-[#00FFA3]' : 'bg-blue-600/80 group-hover:bg-blue-500'}`} style={{ height: `${data.demands}%`, animationDelay: `${idx * 100}ms` }}>
                <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${textMain}`}>{data.demands}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* X-Axis Labels */}
        <div className="flex justify-between pl-4 mt-4 relative z-10">
          {trendData.map((data, idx) => (
            <div key={idx} className={`flex-1 text-center text-xs font-mono font-bold ${textMuted}`}>{data.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}