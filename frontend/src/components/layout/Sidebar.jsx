import { useState, useEffect } from 'react';
import {
  BarChart2,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lightbulb,
  LayoutDashboard,
  Map,
  MessageSquare,
  Settings,
  Sparkles,
  Star,
  Users,
  Box,
  Layers,
  LogOut,
  UserCheck
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser, getStoredWorkspaces, setCurrentUser } from '../../utils/workspaceAccess';

export default function Sidebar({ workspaceId: propWorkspaceId, isDark = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentUser = getCurrentUser();
  const workspaces = getStoredWorkspaces();
  const activeWorkspace = workspaces.find((ws) => ws.id === propWorkspaceId) || workspaces[0] || {
    id: 'ecommerce-platform',
    name: 'E-Commerce Platform',
    membersCount: 12
  };

  const wsId = propWorkspaceId || activeWorkspace.id;
  const basePath = `/workspace/${wsId}`;

  const mainMenuItems = [
    { icon: LayoutDashboard, label: 'PM Dashboard', path: `${basePath}/overview` },
    { icon: Lightbulb, label: 'Insights', path: `${basePath}/intelligence/insights` },
    { icon: MessageSquare, label: 'Feedback', path: `${basePath}/data/datasets` },
    { icon: Box, label: 'Features', path: `${basePath}/intelligence/issues` },
    { icon: Star, label: 'Prioritization', path: `${basePath}/development/phases` },
    { icon: FileText, label: 'Requirements', path: `${basePath}/development/validation` },
    { icon: Map, label: 'Roadmap', path: `${basePath}/development/tasks` },
    { icon: BarChart2, label: 'Reports', path: `${basePath}/reports` },
    { icon: Sparkles, label: 'AI Assistant', path: `${basePath}/assistant` },
  ];

  const workspaceMenuItems = [
    { icon: Layers, label: 'Workspaces', path: '/workspaces' },
    { icon: Settings, label: 'Settings', path: '/profile' },
  ];

  const isActive = (path) => {
    if (path === '/workspaces') {
      return location.pathname === '/workspaces' || location.pathname.startsWith('/workspaces/');
    }
    return location.pathname === path;
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
    setShowUserMenu(false);
    navigate('/workspaces');
    window.location.reload();
  };

  return (
    <aside className={`${isCollapsed ? 'w-[78px]' : 'w-[264px]'} h-screen bg-[#0a0d16] border-r border-[#1a2133] flex flex-col justify-between py-5 px-3 shrink-0 font-sans transition-[width] duration-300 z-30 select-none relative`}>
      
      {/* Top Brand */}
      <div className="min-h-0 flex flex-col flex-1 overflow-hidden">
        <Link 
          to={basePath ? `${basePath}/overview` : '/workspaces'} 
          className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'} mb-6 group`}
          title="ProdIntel AI"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4f2ee8] to-[#7952fc] shadow-md shadow-[#5b3df5]/30">
            <Brain className="text-white" size={22} />
          </div>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-bold leading-tight text-white tracking-tight">ProdIntel AI</span>
              <span className="truncate text-[10px] font-medium tracking-wide text-slate-400">Product Intelligence Platform</span>
            </div>
          )}
        </Link>

        {/* Navigation links */}
        <nav className="space-y-1 overflow-y-auto scrollbar-hide flex-1 pr-0.5">
          {mainMenuItems.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            return (
              <Link
                key={label}
                to={path}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${isCollapsed ? 'justify-center' : ''} ${
                  active 
                    ? 'bg-[#5b3df5] text-white shadow-lg shadow-[#5b3df5]/30 font-bold' 
                    : 'text-slate-400 hover:bg-[#141b2d] hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}

          {/* WORKSPACE Section Header */}
          {!isCollapsed && (
            <div className="pt-5 pb-2 px-3">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Workspace
              </span>
            </div>
          )}

          {workspaceMenuItems.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            return (
              <Link
                key={label}
                to={path}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${isCollapsed ? 'justify-center' : ''} ${
                  active 
                    ? 'bg-[#5b3df5] text-white shadow-lg shadow-[#5b3df5]/30 font-bold' 
                    : 'text-slate-400 hover:bg-[#141b2d] hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom widgets & user card */}
      <div className="mt-3 space-y-3 pt-3 border-t border-[#1a2133] shrink-0">
        {!isCollapsed && (
          <>
            {/* Current Workspace Pill */}
            <div className="bg-[#111726] border border-[#1e273d] rounded-xl p-3">
              <div className="text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Current Workspace</span>
                <ChevronDown size={12} className="text-slate-500" />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#5b3df5]/20 border border-[#5b3df5]/30 flex items-center justify-center shrink-0">
                  <Box className="w-4 h-4 text-[#a78bfa]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{activeWorkspace.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{activeWorkspace.membersCount || activeWorkspace.members?.length || 12} Members</p>
                </div>
              </div>
            </div>

            {/* Storage Progress */}
            <div className="bg-[#111726] border border-[#1e273d] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-slate-400">Storage</span>
                <span className="text-slate-200 font-bold">78%</span>
              </div>
              <div className="h-1.5 w-full bg-[#1b2336] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#5b3df5] to-[#8b5cf6] rounded-full w-[78%]"></div>
              </div>
              <div className="text-[10px] font-medium text-slate-500">7.8 GB / 10 GB</div>
            </div>
          </>
        )}

        {/* User Card */}
        <div className="relative">
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-3 rounded-xl p-2 bg-[#111726] border border-[#1e273d] hover:border-[#5b3df5]/50 transition-all cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
          >
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0" 
            />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.roleTitle}</p>
              </div>
            )}
            {!isCollapsed && <ChevronDown size={14} className="text-slate-400 shrink-0" />}
          </div>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-[#141b2d] border border-[#232d46] rounded-xl shadow-2xl p-2 space-y-1 z-50 text-xs">
              <div className="px-2 py-1.5 text-[10px] font-mono text-slate-400 border-b border-white/[0.06] mb-1">
                Signed in as <span className="text-white font-bold">{currentUser.email}</span>
              </div>

              {currentUser.email !== 'pm@demo.com' && (
                <button
                  type="button"
                  onClick={handleSwitchToPM}
                  className="w-full text-left px-2 py-2 rounded-lg hover:bg-white/[0.06] text-amber-300 font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck size={14} /> Switch to Priya Sharma (PM)
                </button>
              )}

              <button
                type="button"
                onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-white/[0.06] text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <Settings size={14} /> Account Settings
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!isCollapsed && <span className="text-[11px] font-medium">Collapse</span>}
        </button>
      </div>

    </aside>
  );
}

