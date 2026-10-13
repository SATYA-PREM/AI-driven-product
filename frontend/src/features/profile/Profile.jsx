import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CyberCanvas from '../landing/CyberCanvas';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheck, UserCheck, Key, Settings, LogOut, ArrowLeft, Save, Sparkles } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [userRole, setUserRole] = useState('MANAGER'); // 'MANAGER' or 'USER'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#04060d] text-slate-100' : 'bg-[#f8fafc] text-slate-900'} font-sans relative overflow-hidden selection:bg-purple-600 selection:text-white pb-16`}>
      {/* 1. Atmospheric Ambient CyberCanvas Layer */}
      {isDark && <CyberCanvas />}

      {/* 2. Ambient Background Glows */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute -top-32 left-1/3 w-[800px] h-[350px] bg-gradient-to-b from-purple-600/15 via-blue-600/10 to-transparent blur-[140px]" />
          <div className="absolute top-[500px] -right-32 w-[600px] h-[600px] bg-cyan-500/10 blur-[160px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto pt-10 px-6 flex justify-between items-center mb-10">
        <button 
          onClick={() => navigate(-1)} 
          className={`inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border ${
            isDark ? 'text-slate-400 hover:text-purple-400 bg-white/[0.03] border-white/[0.08]' : 'text-slate-600 hover:text-purple-600 bg-white border-slate-200 shadow-sm'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Workspace
        </button>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            isDark ? 'text-slate-300 border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08]' : 'text-slate-600 border-slate-200 bg-white hover:bg-slate-100 shadow-sm'
          }`}>
            Discard
          </button>
          <button className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 hover:scale-[1.02] transition-all flex items-center gap-2">
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar - Navigation & Role Switcher */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`p-6 rounded-2xl border backdrop-blur-xl shadow-xl ${
            isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200 shadow-xl'
          }`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-md shadow-purple-500/20">
                YD
              </div>
              <div>
                <h2 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Yash Dev
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                </h2>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                  {userRole === 'MANAGER' ? 'Product Manager' : 'Team User'}
                </p>
              </div>
            </div>

            {/* Role Switcher Section */}
            <div className={`mb-6 p-3.5 rounded-xl border ${
              isDark ? 'bg-black/40 border-white/[0.06]' : 'bg-slate-50 border-slate-200'
            }`}>
              <label className="block text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-2">
                Access Role Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setUserRole('MANAGER')}
                  className={`py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    userRole === 'MANAGER' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                      : isDark ? 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Manager
                </button>
                <button 
                  onClick={() => setUserRole('USER')}
                  className={`py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    userRole === 'USER' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                      : isDark ? 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  User
                </button>
              </div>
            </div>
            
            <nav className="space-y-1.5">
              {[
                { id: 'general', label: 'General', icon: UserCheck },
                { id: 'security', label: 'Security', icon: ShieldCheck },
                { id: 'api_keys', label: 'API Keys', icon: Key },
                { id: 'preferences', label: 'Preferences', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-2.5 cursor-pointer ${
                      activeTab === tab.id 
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold' 
                        : isDark ? 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <button 
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            className="w-full py-3.5 rounded-2xl border border-red-500/20 text-red-400 bg-red-500/[0.04] text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 transition-colors flex justify-center items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Terminate Session
          </button>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          <div className={`p-8 rounded-2xl border backdrop-blur-xl shadow-xl min-h-[500px] ${
            isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200 shadow-xl'
          }`}>
            
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>General Information ({userRole} Profile)</h2>
                  <p className="text-xs text-slate-400">Managing access rights and workspace privileges for {userRole.toLowerCase()} tier.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">First Name</label>
                    <input 
                      type="text" 
                      defaultValue="Yash" 
                      className={`w-full px-4 py-2.5 rounded-xl border focus:border-purple-500/60 focus:outline-none text-sm transition-colors ${
                        isDark ? 'bg-black/40 border-white/[0.08] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Last Name</label>
                    <input 
                      type="text" 
                      defaultValue="Dev" 
                      className={`w-full px-4 py-2.5 rounded-xl border focus:border-purple-500/60 focus:outline-none text-sm transition-colors ${
                        isDark ? 'bg-black/40 border-white/[0.08] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="sysadmin@prodai.io" 
                      className={`w-full px-4 py-2.5 rounded-xl border focus:border-purple-500/60 focus:outline-none text-sm transition-colors ${
                        isDark ? 'bg-black/40 border-white/[0.08] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Assigned Profile Privileges</label>
                    <div className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between ${
                      isDark ? 'bg-white/[0.03] border-white/[0.08] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <span>{userRole === 'MANAGER' ? 'Full Pipeline Control, Checkpoint Approval & Analytics Access' : 'Task Execution, Issue Reporting & Dedicated Role View'}</span>
                      <span className="px-2.5 py-1 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-mono uppercase tracking-widest font-bold">{userRole}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Security Settings</h2>
                  <p className="text-xs text-slate-400">Update your credentials and account authentication.</p>
                </div>
                <div className="space-y-6 max-w-lg">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Current Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className={`w-full px-4 py-2.5 rounded-xl border focus:border-purple-500/60 focus:outline-none text-sm transition-colors ${
                        isDark ? 'bg-black/40 border-white/[0.08] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className={`w-full px-4 py-2.5 rounded-xl border focus:border-purple-500/60 focus:outline-none text-sm transition-colors ${
                        isDark ? 'bg-black/40 border-white/[0.08] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api_keys' && (
              <div className="space-y-8">
                <div>
                  <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>API Integrations</h2>
                  <p className="text-xs text-slate-400">Manage external tokens for automated feedback pipelines.</p>
                </div>
                <div className={`p-4 rounded-xl border text-xs ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  No active public API keys generated. Click below to provision a webhook secret.
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <div>
                  <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Preferences</h2>
                  <p className="text-xs text-slate-400">Customize notification alerts and theme rendering.</p>
                </div>
                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <h4 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Atmospheric Ambient Visuals</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Enable GPU-accelerated particle network background</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">Active</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}