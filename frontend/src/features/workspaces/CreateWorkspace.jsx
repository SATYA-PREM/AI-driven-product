import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getWorkspaceOwnerDefaults, isProductManager } from '../../utils/workspaceAccess';

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    source: 'web',
    aiModules: true
  });

  useEffect(() => {
    if (!isProductManager()) {
      navigate('/workspaces', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (isDeploying) {
      const deployLogs = [
        "Initializing node cluster...",
        "Allocating AI processing units...",
        `Connecting ${formData.source.toUpperCase()} telemetry stream...`,
        formData.aiModules ? "Enabling semantic analysis engine..." : "Bypassing AI modules...",
        "Establishing secure tunnel...",
        "Node deployment successful!"
      ];
      
      let i = 0;
      const interval = setInterval(() => {
        if (i < deployLogs.length) {
          setLogs(prev => [...prev, deployLogs[i]]);
          i++;
        } else {
          clearInterval(interval);
          
          const newId = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
          const newWorkspace = { 
            id: newId, 
            name: formData.name, 
            role: 'PRODUCT_MANAGER',
            users: 1, 
            status: formData.aiModules ? 'Processing' : 'Active',
            description: `${formData.name} autonomous product telemetry and intelligence node.`,
            createdAt: 'Just now',
            ...getWorkspaceOwnerDefaults(),
            stats: {
              totalFeedback: '0',
              feedbackGrowth: '0%',
              totalFeatures: '0',
              featuresGrowth: '0%',
              insightsGenerated: '0',
              insightsGrowth: '0%',
              activeMembers: '1',
              membersGrowth: '0%',
              dataSources: '1',
              dataSourcesGrowth: 'new'
            },
            dataSources: [
              { id: `ds_${Date.now()}`, name: 'User Interviews', count: '0', icon: 'MessageSquare', color: 'text-blue-400 bg-blue-500/10' }
            ],
            recentActivity: [
              {
                id: `act_${Date.now()}`,
                activity: 'Workspace node deployed',
                user: 'Priya Sharma',
                module: 'Workspace',
                moduleColor: 'bg-purple-950/70 text-purple-300 border-purple-800/50',
                time: 'Just now',
                icon: 'Layers'
              }
            ]
          };
          const existingWorkspaces = JSON.parse(localStorage.getItem('mock_workspaces') || '[]');
          localStorage.setItem('mock_workspaces', JSON.stringify([...existingWorkspaces, newWorkspace]));

          setTimeout(() => navigate('/workspaces'), 800);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isDeploying, navigate, formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!formData.name) return;
    setIsDeploying(true);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-[#00FFA3] selection:text-black">
      
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md h-16 flex items-center px-8 sticky top-0 z-50">
        <Link to="/workspaces" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-[#00FFA3]/50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </div>
          <span className="font-mono text-xs tracking-widest uppercase font-bold">Return to Dashboard</span>
        </Link>
      </nav>

      <main className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-12 animate-fade-in-up">
        
        <div className="space-y-10 lg:pr-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00FFA3]/30 bg-[#00FFA3]/10 text-[#00FFA3] text-[10px] font-mono font-bold tracking-widest uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-ping"></span>
              Workspace Setup
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Deploy New Node</h1>
            <p className="text-gray-400 text-sm leading-relaxed">Configure your telemetry pipeline. The AI assistant will automatically analyze data streams connected to this workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">
                Workspace Name <span className="text-[#00FFA3]">*</span>
              </label>
              <input 
                type="text" 
                required 
                disabled={isDeploying}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-4 bg-[#0a0a0a] border border-white/10 rounded-2xl text-lg text-white placeholder:text-gray-700 focus:outline-none focus:border-[#00FFA3]/50 focus:bg-black transition-all" 
                placeholder="e.g., E-Commerce Q3 Analytics" 
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">
                Primary Telemetry Source
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: 'web', label: 'Web App', icon: '🌐' },
                  { id: 'ios', label: 'iOS App', icon: '📱' },
                  { id: 'api', label: 'REST API', icon: '⚡' }
                ].map((src) => (
                  <label key={src.id} className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 relative overflow-hidden ${formData.source === src.id ? 'bg-[#00FFA3]/10 border-[#00FFA3] text-white shadow-[0_0_20px_rgba(0,255,163,0.1)]' : 'bg-[#0a0a0a] border-white/10 text-gray-500 hover:border-white/30'}`}>
                    <input 
                      type="radio" 
                      name="source" 
                      disabled={isDeploying}
                      value={src.id}
                      checked={formData.source === src.id}
                      onChange={(e) => setFormData({...formData, source: e.target.value})}
                      className="hidden" 
                    />
                    <span className="text-2xl grayscale opacity-80">{src.icon}</span>
                    <span className="font-mono text-xs font-bold uppercase tracking-widest">{src.label}</span>
                    {formData.source === src.id && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00FFA3]"></div>}
                  </label>
                ))}
              </div>
            </div>

            <div className={`p-6 rounded-2xl border transition-all flex items-center justify-between ${formData.aiModules ? 'bg-[#00FFA3]/5 border-[#00FFA3]/30' : 'bg-[#0a0a0a] border-white/10'}`}>
              <div>
                <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                  <svg className={`w-4 h-4 ${formData.aiModules ? 'text-[#00FFA3]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Semantic AI Analysis
                </h4>
                <p className="text-xs text-gray-500 font-mono">Auto-generate insights from raw telemetry logs.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" disabled={isDeploying} className="sr-only peer" checked={formData.aiModules} onChange={() => setFormData({...formData, aiModules: !formData.aiModules})} />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00FFA3]"></div>
              </label>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isDeploying || !formData.name}
                className="w-full h-14 rounded-xl font-mono text-xs font-bold tracking-[0.2em] uppercase bg-[#00FFA3] text-black hover:shadow-[0_0_30px_rgba(0,255,163,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                {isDeploying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Deploying Resources...
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Initialize Workspace</span>
                    <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="hidden lg:block relative rounded-[2rem] bg-[#0a0a0a]/50 border border-white/10 p-2 overflow-hidden h-full min-h-[600px]">
          <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-black/50 rounded-t-[1.5rem]">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            <div className="ml-4 font-mono text-[10px] text-gray-500">Node_Compiler_Preview</div>
          </div>
          
          <div className="p-8 h-[calc(100%-2.5rem)] relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className={`flex-1 rounded-2xl border ${isDeploying ? 'border-[#00FFA3]/50 bg-[#00FFA3]/5 shadow-[inset_0_0_50px_rgba(0,255,163,0.1)]' : 'border-white/5 bg-white/5'} p-8 transition-all duration-700 flex flex-col items-center justify-center text-center`}>
                
                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mb-6 transition-all duration-700 ${isDeploying ? 'border-[#00FFA3] animate-pulse' : 'border-white/10'}`}>
                  <span className="text-4xl">{formData.source === 'web' ? '🌐' : formData.source === 'ios' ? '📱' : '⚡'}</span>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{formData.name || 'Untitled Workspace'}</h3>
                <p className="font-mono text-xs text-gray-500 mb-6">
                  ID: {isDeploying ? 'GENERATING...' : 'PENDING_CREATION'}
                </p>
                
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-mono uppercase text-gray-400">SRC: {formData.source}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase ${formData.aiModules ? 'bg-[#00FFA3]/20 text-[#00FFA3]' : 'bg-white/10 text-gray-400'}`}>
                    AI: {formData.aiModules ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>

              <div className="h-48 mt-6 rounded-2xl bg-black border border-white/10 p-4 font-mono text-[11px] overflow-hidden">
                <div className="text-gray-500 mb-2">{'>'} Awaiting deployment command...</div>
                {logs.map((log, index) => (
                  <div key={index} className="text-[#00FFA3] mb-1 animate-fade-in-up flex gap-2">
                    <span className="text-gray-600">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span> 
                    {log}
                  </div>
                ))}
                {isDeploying && logs.length < 6 && (
                  <div className="w-2 h-4 bg-[#00FFA3] animate-pulse mt-1"></div>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}