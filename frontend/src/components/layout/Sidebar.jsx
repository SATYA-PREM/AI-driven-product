import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lightbulb,
  LayoutDashboard,
  LayoutGrid,
  Map,
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  Star,
  UploadCloud,
  Users,
  Cpu,
  Bot,
  Activity,
  Database,
  TrendingUp,
  AlertTriangle,
  Target,
  Heart,
  UserCheck,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  isProductManager,
  getCurrentUser,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  subscribeToActiveWorkspace,
  setStoredWorkspaces,
} from '../../utils/workspaceAccess';
import { workspaceApi } from '../../api/client';

export default function Sidebar({ workspaceId: propWorkspaceId }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWsId, setActiveWsId] = useState(() => propWorkspaceId || getActiveWorkspaceId());
  const isPm = isProductManager();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (propWorkspaceId) {
      setActiveWorkspaceId(propWorkspaceId);
      setActiveWsId(propWorkspaceId);
    }
  }, [propWorkspaceId]);

  useEffect(() => {
    return subscribeToActiveWorkspace((newId) => {
      setActiveWsId(newId);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    workspaceApi.listWorkspaces()
      .then((res) => {
        if (isMounted && Array.isArray(res)) {
          setWorkspaces(res);
          setStoredWorkspaces(res);
          const currentId = propWorkspaceId || getActiveWorkspaceId();
          if (currentId) {
            setActiveWsId(currentId);
          } else if (res.length > 0) {
            const firstId = res[0].id || res[0]._id;
            setActiveWorkspaceId(firstId);
            setActiveWsId(firstId);
          }
        }
      })
      .catch((err) => {
        console.warn('Sidebar listWorkspaces notice:', err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeWorkspace = workspaces.find((ws) => (ws.id || ws._id) === activeWsId) || (workspaces.length > 0 ? workspaces[0] : {
    id: activeWsId || 'default-workspace',
    name: 'Workspace',
    members_count: 1
  });

  const wsId = activeWsId || activeWorkspace.id;
  const basePath = `/workspace/${wsId}`;

  const navItems = [
    { icon: LayoutDashboard, label: 'PM Dashboard', path: `${basePath}/pm-dashboard`, badge: 'PM' },
    { icon: LayoutGrid, label: 'Workspace Hub', path: `${basePath}/dashboard` },
    { icon: Database, label: 'Datasets Studio', path: `${basePath}/data/datasets` },
    { icon: UploadCloud, label: 'New Upload', path: `${basePath}/data/upload` },
    { icon: Cpu, label: 'Data Agent', path: `${basePath}/data/agent` },
    { icon: Bot, label: '3-Agent Pipeline', path: `${basePath}/ai/analysis` },
    { icon: Activity, label: 'Live Workflow', path: `${basePath}/workflow` },
    { icon: Lightbulb, label: 'Insights Dashboard', path: `${basePath}/intelligence/insights` },
    { icon: AlertTriangle, label: 'Critical Issues', path: `${basePath}/intelligence/issues` },
    { icon: UserCheck, label: 'PM Review', path: `${basePath}/pm-review`, badge: 'Gate' },
    { icon: MessageSquare, label: 'Feedback', path: `${basePath}/feedback` },
    {
      icon: Star,
      label: 'Features',
      path: `${basePath}/features`,
      subItems: [
        { label: 'Overview', path: `${basePath}/features/overview` },
      ],
    },
    { icon: Target, label: 'Prioritization', path: `${basePath}/development/phases` },
    { icon: FileText, label: 'Requirements', path: `${basePath}/development/validation` },
    { icon: Map, label: 'Roadmap', path: `${basePath}/development/tasks` },
    { icon: BarChart2, label: 'Reports', path: `${basePath}/reports` },
    { icon: Sparkles, label: 'AI Assistant', path: `${basePath}/assistant` },
  ];

  const workspaceNavItems = [
    { icon: LayoutGrid, label: 'Workspaces', path: '/workspaces' },
    { icon: Plus, label: 'Create Workspace', path: '/workspaces/new' },
    { icon: Settings, label: 'Workspace Settings', path: `${basePath}/settings` },
  ];

  const isActive = (path) => {
    if (path.includes('#')) {
      const [base, hash] = path.split('#');
      return location.pathname === base && location.hash === `#${hash}`;
    }
    if (path.endsWith('/insights')) {
      return location.pathname.endsWith('/insights') && (!location.hash || location.hash === '#Overview');
    }
    if (path === '/workspaces') {
      return location.pathname === '/workspaces';
    }
    if (path === '/workspaces/new') {
      return location.pathname === '/workspaces/new';
    }
    if (path.endsWith('/settings')) {
      return location.pathname.endsWith('/settings') || location.pathname === '/workspaces/settings';
    }
    if (path.endsWith('/pm-dashboard')) {
      return location.pathname.endsWith('/pm-dashboard');
    }
    if (path.includes('/features')) {
      return location.pathname.includes('/features');
    }
    return location.pathname === path;
  };


  return (
    <aside className={`${isCollapsed ? 'w-[74px]' : 'w-[250px]'} h-screen bg-[#070a12] border-r border-[#151b2a] flex flex-col justify-between py-4 px-3 shrink-0 font-sans transition-[width] duration-300 z-30 select-none relative`}>
      
      {/* Top Brand */}
      <div className="min-h-0 flex flex-col flex-1 overflow-hidden">
        <div className={`flex items-center justify-between ${isCollapsed ? 'justify-center' : 'px-2'} mb-5 group`}>
          <Link 
            to={`${basePath}/pm-dashboard`} 
            className="flex items-center gap-3 min-w-0"
            title="ProdIntel AI"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5b3df5] to-[#7c3aed] shadow-md shadow-[#5b3df5]/30">
              <Brain className="text-white" size={20} />
            </div>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-bold leading-tight text-white tracking-tight">ProdIntel AI</span>
                <span className="truncate text-[10px] font-medium tracking-wide text-slate-400">Product Intelligence Platform</span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button 
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="text-slate-500 hover:text-white transition-colors p-1 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="space-y-1 overflow-y-auto scrollbar-hide flex-1 pr-0.5">
          {navItems.map(({ icon: Icon, label, path, badge, subItems }) => {
            const active = isActive(path);
            const isExpanded = active && !isCollapsed && subItems && subItems.length > 0;

            return (
              <div key={label} className="space-y-1">
                <Link
                  to={path}
                  title={isCollapsed ? label : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-150 group ${isCollapsed ? 'justify-center' : 'justify-between'} ${
                    active 
                      ? 'bg-[#5b3df5] text-white shadow-lg shadow-[#5b3df5]/30 font-semibold' 
                      : 'text-slate-400 hover:bg-[#111726] hover:text-slate-200 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                    {!isCollapsed && <span className="truncate">{label}</span>}
                  </div>
                  {!isCollapsed && label === 'PM Dashboard' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      PM
                    </span>
                  )}
                  {!isCollapsed && label === 'PM Review' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Gate
                    </span>
                  )}
                  {!isCollapsed && subItems && (
                    <ChevronDown size={14} className={`text-white/80 shrink-0 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                  )}
                  {!isCollapsed && active && !subItems && label !== 'PM Dashboard' && label !== 'PM Review' && (
                    <ChevronRight size={14} className="text-white/80 shrink-0" />
                  )}
                </Link>

                {/* Subheadings under parent nav item */}
                {isExpanded && (
                  <div className="pl-8 pr-2 space-y-1 pt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {subItems.map((sub) => {
                      const isSubActive = location.pathname === sub.path || (sub.label === 'Overview' && location.pathname === path);
                      return (
                        <Link
                          key={sub.label}
                          to={sub.path}
                          className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[11px] transition-colors ${
                            isSubActive
                              ? 'bg-white/10 text-white font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span>{sub.label}</span>
                          {isSubActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* WORKSPACE SECTION */}
          {!isCollapsed && (
            <div className="pt-3 pb-1 px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                WORKSPACE
              </span>
            </div>
          )}

          {workspaceNavItems.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            return (
              <Link
                key={label}
                to={path}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-150 group ${isCollapsed ? 'justify-center' : 'justify-between'} ${
                  active 
                    ? 'bg-[#5b3df5] text-white shadow-lg shadow-[#5b3df5]/30 font-semibold' 
                    : 'text-slate-400 hover:bg-[#111726] hover:text-slate-200 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={16} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </div>
                {!isCollapsed && active && (
                  <ChevronRight size={14} className="text-white/80 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom widgets */}
      <div className="mt-2 space-y-2.5 pt-2 border-t border-[#131929] shrink-0 relative">
        {!isCollapsed && (
          <>
            {/* Current Workspace Card with Switcher Popup Trigger */}
            <div className="relative">
              <div 
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className="bg-[#0e1322] border border-[#1a2236] hover:border-[#2a375a] rounded-xl p-2.5 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#5b3df5]/20 border border-[#5b3df5]/30 flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-4 h-4 text-[#a78bfa]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{activeWorkspace.name}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{activeWorkspace.members_count ?? activeWorkspace.membersCount ?? 1} Members</p>
                  </div>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Workspace Switcher Popup Menu (as in media_1789578944413.jpg) */}
              {isSwitcherOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#0d121f] border border-[#1e2942] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between px-2.5 py-2 border-b border-[#1a233a] mb-1">
                    <span className="text-xs font-bold text-white">Switch Workspace</span>
                    <Link
                      to="/workspaces/new"
                      onClick={() => setIsSwitcherOpen(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
                      title="Create Workspace"
                    >
                      <Plus size={14} />
                    </Link>
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                    {workspaces.map((ws) => {
                      const wsIdentifier = ws.id || ws._id;
                      const isCurrent = wsIdentifier === (activeWorkspace.id || activeWorkspace._id);
                      return (
                        <Link
                          key={wsIdentifier}
                          to={`/workspace/${wsIdentifier}/overview`}
                          onClick={() => {
                            setActiveWorkspaceId(wsIdentifier);
                            setActiveWsId(wsIdentifier);
                            setIsSwitcherOpen(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                            isCurrent
                              ? 'bg-[#5b3df5]/15 border border-[#5b3df5]/30 text-white font-bold'
                              : 'text-slate-300 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#5b3df5]/20 border border-[#5b3df5]/30 flex items-center justify-center shrink-0">
                              <LayoutGrid className="w-3.5 h-3.5 text-[#a78bfa]" />
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{ws.name}</span>
                                {isCurrent && (
                                  <span className="text-[8px] px-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Active
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-500 block">{ws.members_count ?? ws.membersCount ?? 1} Members</span>
                            </div>
                          </div>
                          {isCurrent && <ChevronRight size={13} className="text-[#8b5cf6] shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-[#1a233a]">
                    <Link
                      to="/workspaces"
                      onClick={() => setIsSwitcherOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      <Settings size={13} />
                      <span>Manage Workspaces</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Storage Meter */}
            <div className="space-y-1 px-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Storage</span>
                <span className="text-slate-300 font-bold text-[11px]">78%</span>
              </div>
              <div className="h-1.5 w-full bg-[#171e31] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#5b3df5] to-[#8b5cf6] rounded-full w-[78%]"></div>
              </div>
              <div className="text-[10px] font-medium text-slate-500">7.8 GB / 10 GB</div>
            </div>

            {/* User Profile Bar */}
            <div className="pt-1.5 border-t border-[#131929] flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                  alt="Priya Sharma"
                  className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">{currentUser.name || 'Priya Sharma'}</p>
                  <p className="text-[10px] text-slate-400 truncate leading-tight">{currentUser.roleTitle || 'Product Manager'}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {!isCollapsed && <span className="text-[11px] font-medium">Collapse</span>}
        </button>
      </div>

    </aside>
  );
}

