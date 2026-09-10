import { useState } from 'react';
import {
  BarChart2,
  Brain,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lightbulb,
  LayoutDashboard,
  LayoutGrid,
  Map,
  MessageSquare,
  Settings,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getStoredWorkspaces } from '../../utils/workspaceAccess';

export default function Sidebar({ workspaceId: propWorkspaceId }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const workspaces = getStoredWorkspaces();
  const activeWorkspace = workspaces.find((ws) => ws.id === propWorkspaceId) || workspaces[0] || {
    id: 'ecommerce-platform',
    name: 'E-Commerce Platform',
    membersCount: 12
  };

  const wsId = propWorkspaceId || activeWorkspace.id;
  const basePath = `/workspace/${wsId}`;

  const navItems = [
    { icon: LayoutDashboard, label: 'PM Dashboard', path: `${basePath}/overview` },
    { icon: Lightbulb, label: 'Insights', path: `${basePath}/intelligence/insights` },
    { icon: MessageSquare, label: 'Feedback', path: `${basePath}/data/datasets` },
    { icon: LayoutGrid, label: 'Features', path: `${basePath}/intelligence/issues` },
    { icon: Star, label: 'Prioritization', path: `${basePath}/development/phases` },
    { icon: FileText, label: 'Requirements', path: `${basePath}/development/validation` },
    { icon: Map, label: 'Roadmap', path: `${basePath}/development/tasks` },
    { icon: BarChart2, label: 'Reports', path: `${basePath}/reports` },
    { icon: Sparkles, label: 'AI Assistant', path: `${basePath}/assistant` },
    { icon: Users, label: 'Workspace Members', path: '/workspaces' },
    { icon: Settings, label: 'Settings', path: '/profile' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`${isCollapsed ? 'w-[74px]' : 'w-[250px]'} h-screen bg-[#070a12] border-r border-[#151b2a] flex flex-col justify-between py-4 px-3 shrink-0 font-sans transition-[width] duration-300 z-30 select-none relative`}>
      
      {/* Top Brand */}
      <div className="min-h-0 flex flex-col flex-1 overflow-hidden">
        <div className={`flex items-center justify-between ${isCollapsed ? 'justify-center' : 'px-2'} mb-6 group`}>
          <Link 
            to={`${basePath}/overview`} 
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
              className="text-slate-500 hover:text-white transition-colors p-1"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="space-y-1 overflow-y-auto scrollbar-hide flex-1 pr-0.5">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = isActive(path);
            return (
              <Link
                key={label}
                to={path}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-150 group ${isCollapsed ? 'justify-center' : 'justify-between'} ${
                  active 
                    ? 'bg-[#5b3df5] text-white shadow-lg shadow-[#5b3df5]/30 font-semibold' 
                    : 'text-slate-400 hover:bg-[#111726] hover:text-slate-200 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={17} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
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
      <div className="mt-3 space-y-3.5 pt-3 shrink-0">
        {!isCollapsed && (
          <>
            {/* Current Workspace Card */}
            <div className="bg-[#0e1322] border border-[#1a2236] rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#5b3df5]/20 border border-[#5b3df5]/30 flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-4 h-4 text-[#a78bfa]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 block leading-tight">Current Workspace</span>
                  <p className="text-xs font-bold text-white truncate mt-0.5">{activeWorkspace.name}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{activeWorkspace.membersCount || 12} Members</p>
                </div>
              </div>
            </div>

            {/* Workspace Usage */}
            <div className="space-y-1.5 px-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Workspace Usage</span>
                <span className="text-slate-300 font-bold text-[11px]">78%</span>
              </div>
              <div className="h-1.5 w-full bg-[#171e31] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#5b3df5] to-[#8b5cf6] rounded-full w-[78%]"></div>
              </div>
              <div className="text-[10px] font-medium text-slate-500">7.8 GB / 10 GB</div>
            </div>
          </>
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!isCollapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>

    </aside>
  );
}

