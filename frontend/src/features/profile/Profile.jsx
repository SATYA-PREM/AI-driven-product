import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  // Role state as per PDF requirements: Manager vs User
  const [userRole, setUserRole] = useState('MANAGER'); // 'MANAGER' or 'USER'

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans relative overflow-hidden selection:bg-[#00FFA3] selection:text-black pb-12">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-[40%] h-[40%] bg-[#00FFA3]/10 blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>
      
      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto pt-12 px-6 flex justify-between items-center mb-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-gray-500 hover:text-[#00FFA3] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Return to Workspace
        </button>
        <div className="flex gap-4">
          <button className="px-5 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 transition-colors">Discard</button>
          <button className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00FFA3] text-black hover:shadow-[0_0_15px_rgba(0,255,163,0.3)] transition-all hover:scale-105">Save Changes</button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in-up">
        
        {/* Left Sidebar - Navigation & Role Switcher */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-[2rem] bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black bg-black border border-white/10 text-white relative group cursor-pointer overflow-hidden">
                <span className="relative z-10">YD</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Yash Dev</h2>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">{userRole === 'MANAGER' ? 'Product Manager' : 'Team User'}</p>
              </div>
            </div>

            {/* Role Switcher Section (PDF Compliance) */}
            <div className="mb-6 p-3 rounded-xl bg-black/60 border border-white/10">
              <label className="block text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2">Access Role Level</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setUserRole('MANAGER')}
                  className={`py-2 rounded-lg text-[10px] font-mono font-bold tracking-widest uppercase transition-all ${userRole === 'MANAGER' ? 'bg-[#00FFA3] text-black shadow-[0_0_10px_rgba(0,255,163,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  Manager
                </button>
                <button 
                  onClick={() => setUserRole('USER')}
                  className={`py-2 rounded-lg text-[10px] font-mono font-bold tracking-widest uppercase transition-all ${userRole === 'USER' ? 'bg-[#00FFA3] text-black shadow-[0_0_10px_rgba(0,255,163,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  User
                </button>
              </div>
            </div>
            
            <nav className="space-y-2">
              {['general', 'security', 'api_keys', 'preferences'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/10 text-white border border-white/5 shadow-sm' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </nav>
          </div>

          <button className="w-full py-4 rounded-[1.5rem] border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 transition-colors flex justify-center items-center gap-2">
            Terminate Session
          </button>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          <div className="p-8 md:p-10 rounded-[2.5rem] bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-3xl min-h-[500px]">
            
            {activeTab === 'general' && (
              <div className="space-y-8 animate-fade-in-up">
                <div>
                  <h2 className="text-xl font-black mb-1">General Information ({userRole} Profile)</h2>
                  <p className="text-xs text-gray-400">Managing access rights and workspace privileges for {userRole.toLowerCase()} tier.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold">First Name</label>
                    <input type="text" defaultValue="Yash" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-[#00FFA3]/50 focus:outline-none text-sm transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold">Last Name</label>
                    <input type="text" defaultValue="Dev" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-[#00FFA3]/50 focus:outline-none text-sm transition-colors" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold">Email Address</label>
                    <input type="email" defaultValue="sysadmin@ai-copilot.net" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-[#00FFA3]/50 focus:outline-none text-sm transition-colors" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold">Assigned Profile Privileges</label>
                    <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm flex items-center justify-between">
                      <span>{userRole === 'MANAGER' ? 'Full Pipeline Control, Checkpoint Approval & Analytics Access' : 'Task Execution, Issue Reporting & Restricted View'}</span>
                      <span className="px-2 py-1 bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/20 rounded text-[10px] font-mono uppercase tracking-widest font-bold">{userRole}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-fade-in-up">
                <div>
                  <h2 className="text-xl font-black mb-1">Security Settings</h2>
                  <p className="text-xs text-gray-400">Update your password and secure your account.</p>
                </div>
                <div className="space-y-6 max-w-lg">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-[#00FFA3]/50 focus:outline-none text-sm transition-colors" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api_keys' && (
              <div className="space-y-8 animate-fade-in-up">
                <div>
                  <h2 className="text-xl font-black mb-1">API Integrations</h2>
                  <p className="text-xs text-gray-400">Manage keys for external data ingestion.</p>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8 animate-fade-in-up">
                <div>
                  <h2 className="text-xl font-black mb-1">Preferences</h2>
                  <p className="text-xs text-gray-400">Customize your workspace experience.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}