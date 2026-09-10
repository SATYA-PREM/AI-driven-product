import { useOutletContext } from 'react-router-dom';

export default function CriticalIssues() {
  const { isDark } = useOutletContext();

  const cardBg = isDark ? 'bg-[#0a0a0a]/60 border-white/10 backdrop-blur-3xl' : 'bg-white/80 border-gray-200 shadow-sm backdrop-blur-3xl';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  const issues = [
    { id: 'ISS-001', name: 'Slow checkout processing', frequency: '1,240', severity: 'HIGH', score: 92 },
    { id: 'ISS-002', name: 'Login timeout failures', frequency: '840', severity: 'HIGH', score: 86 },
    { id: 'ISS-003', name: 'Search filter latency', frequency: '520', severity: 'MEDIUM', score: 71 },
    { id: 'ISS-004', name: 'UI glitch on dark mode', frequency: '310', severity: 'LOW', score: 45 },
  ];

  const getSeverityStyle = (severity) => {
    switch(severity) {
      case 'HIGH': return isDark ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-red-700 bg-red-50 border-red-200';
      case 'MEDIUM': return isDark ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' : 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'LOW': return isDark ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${textMain}`}>Product Issues</h1>
          <p className={`text-sm mt-2 font-medium ${textMuted}`}>AI-clustered problems ranked by priority score.</p>
        </div>
        <div className={`flex items-center gap-2 p-1 rounded-lg border ${isDark ? 'bg-black/50 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          {['All', 'High', 'Medium', 'Low'].map(filter => (
            <button key={filter} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'All' ? (isDark ? 'bg-white/10 text-white' : 'bg-white shadow text-black') : `hover:bg-white/5 ${textMuted}`}`}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={`border-b ${isDark ? 'bg-white/[0.02] border-white/5 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
              <tr>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold">Issue Cluster</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold">Frequency</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold">Severity</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold">Priority Score</th>
                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
              {issues.map((issue) => (
                <tr key={issue.id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-5">
                    <div className={`font-bold text-base ${textMain}`}>{issue.name}</div>
                    <div className={`text-xs font-mono mt-1 ${textMuted}`}>{issue.id}</div>
                  </td>
                  <td className={`px-6 py-5 font-mono text-lg font-bold ${textMain}`}>
                    {issue.frequency}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getSeverityStyle(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold ${textMain}`}>{issue.score}</span>
                      <div className={`w-24 h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <div className={`h-1.5 rounded-full ${issue.score > 80 ? 'bg-red-500' : issue.score > 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${issue.score}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className={`text-xs font-bold transition-colors ${isDark ? 'text-[#00FFA3] hover:text-white' : 'text-blue-600 hover:text-black'}`}>
                      Convert to Tasks →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}