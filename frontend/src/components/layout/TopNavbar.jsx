import { useState, useEffect } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, HelpCircle, ChevronDown, 
  Layers, LogOut, Settings, UserCheck, Shield, Sparkles, RefreshCw
} from 'lucide-react';
import { 
  getCurrentUser, logoutUser, getStoredWorkspaces, 
  getWorkspaceById, setCurrentUser, setActiveWorkspaceId 
} from '../../utils/workspaceAccess';
import { workspaceApi } from '../../api/client';

export default function TopNavbar({ isDark = true }) {
  const { workspaceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWsMenu, setShowWsMenu] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWs, setCurrentWs] = useState(null);

  const currentUser = getCurrentUser();
  const rawName = currentUser?.name || '';
  const displayName = (rawName.toLowerCase() === 'string' || !rawName.trim()) 
    ? (currentUser?.email?.split('@')[0] || 'User') 
    : rawName;

  useEffect(() => {
    let isMounted = true;
    workspaceApi.listWorkspaces()
      .then((res) => {
        if (isMounted && Array.isArray(res)) {
          setWorkspaces(res);
          const found = res.find((w) => (w.id || w._id) === workspaceId);
          if (found) setCurrentWs(found);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [workspaceId]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/pm-dashboard') || path.includes('/overview')) return 'PM Dashboard';
    if (path.includes('/dashboard')) return 'Workspace Hub';
    if (path.includes('/data/datasets')) return 'Datasets Studio';
    if (path.includes('/data/upload')) return 'New Upload';
    if (path.includes('/data/agent') || path.includes('/data/preprocessing')) return 'Data Agent';
    if (path.includes('/ai/analysis') || path.includes('/ai/agents')) return '3-Agent Pipeline';
    if (path.includes('/workflow')) return 'Live Workflow';
    if (path.includes('/intelligence/insights')) return 'Insights';
    if (path.includes('/intelligence/issues')) return 'Critical Issues';
    if (path.includes('/intelligence/trends')) return 'Trends & Sentiment';
    if (path.includes('/development/phases')) return 'Prioritization';
    if (path.includes('/development/validation')) return 'Requirements';
    if (path.includes('/development/tasks')) return 'Roadmap';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/assistant')) return 'AI Assistant';
    if (path.includes('/settings')) return 'Workspace Settings';

    const paths = path.split('/').filter(Boolean);
    const last = paths[paths.length - 1] || 'Dashboard';
    return last.charAt(0).toUpperCase() + last.slice(1).replace('-', ' ');
  };

  const handleSwitchWorkspace = (newId) => {
    setActiveWorkspaceId(newId);
    setShowWsMenu(false);
    const paths = location.pathname.split('/').filter(Boolean);
    const subPath = paths.slice(2).join('/') || 'pm-dashboard';
    navigate(`/workspace/${newId}/${subPath}`);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleSwitchToPM = () => {
    setCurrentUser({
      name: 'Priya Sharma',
      email: 'pm@demo.com',
      role: 'PRODUCT_MANAGER',
      roleTitle: 'Product Manager (Owner)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    });
    window.location.reload();
  };

  return (
    <header className="sticky top-0 h-16 px-6 lg:px-8 border-b border-[#171e30] bg-[#070910]/95 backdrop-blur-xl flex items-center justify-between shrink-0 z-30 shadow-md select-none">
      
      {/* Left: Breadcrumbs & Workspace Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <Link 
          to="/workspaces"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Layers className="w-4 h-4 text-[#8b5cf6]" />
          <span>Workspaces</span>
        </Link>
        <span className="text-slate-600">/</span>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowWsMenu(!showWsMenu)}
            className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#a78bfa] transition-colors cursor-pointer"
          >
            <span className="truncate max-w-[160px] sm:max-w-[220px]">{currentWs?.name || 'Product Workspace'}</span>
            <ChevronDown size={12} className="text-slate-400 shrink-0" />
          </button>

          {/* Workspace dropdown */}
          {showWsMenu && (
            <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-[#121828] border border-[#202a42] shadow-2xl p-1.5 z-50 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 block">
                Switch Workspace
              </span>
              {workspaces.map((ws) => (
                <button
                  key={ws.id || ws._id}
                  type="button"
                  onClick={() => handleSwitchWorkspace(ws.id || ws._id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                    (ws.id || ws._id) === workspaceId 
                      ? 'bg-[#5b3df5] text-white font-bold' 
                      : 'text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  {(ws.id || ws._id) === workspaceId && <span className="text-[10px] font-mono">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-slate-600">/</span>
        <span className="text-xs font-bold text-[#8b5cf6] truncate">{getPageTitle()}</span>
      </div>

      {/* Right Utility Controls & Profile Menu */}
      <div className="flex items-center gap-3.5 shrink-0">
        
        {/* Fast Switch to PM Dashboard Button */}
        <Link
          to={`/workspace/${workspaceId}/pm-dashboard`}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5b3df5]/15 border border-[#5b3df5]/30 text-[#c4b5fd] hover:bg-[#5b3df5]/25 text-xs font-semibold transition-all cursor-pointer"
        >
          <Sparkles size={13} className="text-[#a78bfa]" />
          <span>PM Dashboard</span>
        </Link>

        {/* Search */}
        <button 
          type="button"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button 
          type="button"
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>

        {/* Help */}
        <button 
          type="button"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
          title="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-[#1e273d]"></div>

        {/* Profile Card & Menu */}
        <div className="relative">
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 cursor-pointer p-1 rounded-xl hover:bg-white/[0.05] transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5b3df5] to-[#a855f7] flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/10">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-bold text-white leading-tight truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 leading-tight truncate">Product Manager</p>
            </div>
            <ChevronDown size={12} className="text-slate-500" />
          </div>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#131929] border border-[#212c45] rounded-xl shadow-2xl p-1.5 z-50 text-xs">
              <div className="px-2.5 py-2 border-b border-white/[0.06] mb-1">
                <p className="font-bold text-white">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'pm@productintel.ai'}</p>
              </div>

              <button
                type="button"
                onClick={handleSwitchToPM}
                className="w-full text-left px-2.5 py-2 rounded-lg text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 cursor-pointer font-medium"
              >
                <UserCheck size={14} /> Switch to Priya Sharma (PM)
              </button>

              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-300 hover:bg-white/[0.05] flex items-center gap-2 transition-colors block"
              >
                <Settings size={14} /> Account Settings
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer font-medium"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}