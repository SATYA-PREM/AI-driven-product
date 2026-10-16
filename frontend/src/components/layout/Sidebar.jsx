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
  CheckSquare,
  Code,
  Code2,
  Palette,
  Shield,
  ShieldCheck,
  Compass,
  Edit3,
  ListTodo,
  GitPullRequest,
  Bug,
  AlertOctagon,
  Layers,
  RotateCcw,
  Clock,
  ShieldAlert,
  Briefcase
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
import { workspaceApi } from '../../api/workspaces';
import { useTheme } from '../../context/ThemeContext';
import { cancelWorkspacePrefetch, startWorkspacePrefetch } from '../../utils/prefetchQueue';

export default function Sidebar({ 
  workspaceId: propWorkspaceId, 
  isDark: propIsDark,
  mobileOpen = false,
  setMobileOpen = () => {}
}) {
  const location = useLocation();
  const { isDark: themeIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeIsDark;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Auto-close mobile sidebar whenever user navigates to a new page
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWsId, setActiveWsId] = useState(() => propWorkspaceId || getActiveWorkspaceId());
  const currentUser = getCurrentUser();
  const isPm = isProductManager(currentUser);

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

  // Preload workspace, dataset, and role routes in advance into session cache
  useEffect(() => {
    if (activeWsId && activeWsId !== 'default-workspace' && activeWsId !== 'default-ws') {
      const cleanup = startWorkspacePrefetch(activeWsId, currentUser?.role || 'product_manager', location.pathname);
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [activeWsId, currentUser?.role, location.pathname]);

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

  // Preserve current opened sidebar page when switching workspace
  const getWorkspaceSwitchTarget = (targetWsId) => {
    if (location.pathname.startsWith('/workspace/')) {
      const parts = location.pathname.split('/');
      // parts[0]='', parts[1]='workspace', parts[2]=oldWsId, parts[3+]=subpath
      if (parts.length > 3 && parts[3]) {
        const subpath = parts.slice(3).join('/');
        return `/workspace/${targetWsId}/${subpath}`;
      }
    }
    return isPm
      ? `/workspace/${targetWsId}/pm-dashboard`
      : isQA
      ? `/workspace/${targetWsId}/qa/dashboard`
      : isDeveloper
      ? `/workspace/${targetWsId}/developer/dashboard`
      : isDesigner
      ? `/workspace/${targetWsId}/designer/dashboard`
      : isStakeholder
      ? `/workspace/${targetWsId}/stakeholder/dashboard`
      : `/workspace/${targetWsId}/my-dashboard`;
  };

  // Role detection
  const userRole = String(currentUser?.role || '').toLowerCase();
  const isDesigner = ['designer', 'product_designer', 'product designer', 'ux', 'ux_designer'].includes(userRole);
  const isDeveloper = ['developer', 'dev', 'engineer', 'lead_engineer', 'lead engineer'].includes(userRole);
  const isQA = ['qa', 'tester', 'qa_tester', 'quality_assurance'].includes(userRole);
  const isStakeholder = ['stakeholder', 'business', 'business_owner', 'business owner'].includes(userRole);

  // Dynamic role-specific navigation
  let roleHeader = 'PM DASHBOARD';
  let navItems = [];
  let workspaceNavItems = [];
  let brandLink = `${basePath}/pm-dashboard`;

  if (isPm) {
    roleHeader = 'PM DASHBOARD';
    brandLink = `${basePath}/pm-dashboard`;
    navItems = [
      {
        category: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'PM Dashboard', path: `${basePath}/pm-dashboard`, badge: 'PM' },
          { icon: LayoutGrid, label: 'Workspace Hub', path: `${basePath}/dashboard` },
        ]
      },
      {
        category: 'Data Management',
        items: [
          { icon: Database, label: 'Datasets Studio', path: `${basePath}/data/datasets` },
          { icon: UploadCloud, label: 'New Upload', path: `${basePath}/data/upload` },
        ]
      },
      {
        category: 'Intelligence',
        items: [
          { icon: Cpu, label: 'Data Agent', path: `${basePath}/data/agent` },
          { icon: Bot, label: '3-Agent Pipeline', path: `${basePath}/ai/analysis` },
          { icon: Activity, label: 'Live Workflow', path: `${basePath}/workflow` },
          { icon: Lightbulb, label: 'Insights Dashboard', path: `${basePath}/intelligence/insights` },
          { icon: AlertTriangle, label: 'Critical Issues', path: `${basePath}/intelligence/issues` },
        ]
      },
      {
        category: 'Product Management',
        items: [
          { icon: UserCheck, label: 'PM Review', path: `${basePath}/pm-review`, badge: 'Gate' },
          { icon: MessageSquare, label: 'Feedback', path: `${basePath}/feedback` },
          { icon: Star, label: 'Features', path: `${basePath}/features` },
          { icon: FileText, label: 'PRD Management', path: `${basePath}/development/prd` },
          { icon: Users, label: 'PRD Assignments', path: `${basePath}/prd-assignments` },
          { icon: UserCheck, label: 'Team Responses', path: `${basePath}/team-responses`, badge: 'Review' },
          { icon: ShieldCheck, label: 'Resolution Audit', path: `${basePath}/resolution-audit`, badge: 'Queue' },
          { icon: Sparkles, label: 'AI Assistant', path: `${basePath}/assistant` },
        ]
      }
    ];
    workspaceNavItems = [
      { icon: LayoutGrid, label: 'Workspaces', path: '/workspaces' },
      { icon: Plus, label: 'Create Workspace', path: '/workspaces/new' },
      { icon: Settings, label: 'Workspace Settings', path: `${basePath}/settings` },
    ];
  } else if (isDesigner) {
    roleHeader = 'PRODUCT DESIGNER';
    brandLink = `${basePath}/designer/dashboard`;
    navItems = [
      {
        category: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'My Dashboard', path: `${basePath}/designer/dashboard`, badge: 'UX' },
        ]
      },
      {
        category: 'Design & UX Work',
        items: [
          { icon: ListTodo, label: 'My Assignments', path: `${basePath}/designer/assignments` },
          { icon: Edit3, label: 'Task View & Submission', path: `${basePath}/designer/design-response` },
          { icon: Palette, label: 'UX Requirements', path: `${basePath}/designer/ux-requirements` },
          { icon: Layers, label: 'Assigned PRDs', path: `${basePath}/designer/assigned-prds` },
        ]
      },
      {
        category: 'Customer Research & Evidence',
        items: [
          { icon: MessageSquare, label: 'Customer Feedback & Evidence', path: `${basePath}/designer/customer-feedback` },
          { icon: Lightbulb, label: 'Customer Insights', path: `${basePath}/intelligence/insights` },
        ]
      },
      {
        category: 'Requirements & Context',
        items: [
          { icon: Compass, label: 'Product Context', path: `${basePath}/designer/product-context` },
          { icon: Star, label: 'Related Features', path: `${basePath}/features` },
        ]
      },
      {
        category: 'Assistance',
        items: [
          { icon: Sparkles, label: 'AI Assistant', path: `${basePath}/assistant` },
        ]
      }
    ];
    workspaceNavItems = [
      { icon: LayoutGrid, label: 'Workspace Overview', path: `${basePath}/dashboard` },
    ];
  } else if (isDeveloper) {
    roleHeader = 'DEVELOPER';
    brandLink = `${basePath}/developer/dashboard`;
    navItems = [
      {
        category: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'My Dashboard', path: `${basePath}/developer/dashboard`, badge: 'DEV' },
        ]
      },
      {
        category: 'Development Work',
        items: [
          { icon: ListTodo, label: 'My Assignments', path: `${basePath}/developer/assignments` },
          { icon: FileText, label: 'Assigned PRDs', path: `${basePath}/developer/assigned-prds` },
          { icon: Code2, label: 'Technical Requirements', path: `${basePath}/developer/technical-requirements` },
          { icon: Layers, label: 'Design Handoff', path: `${basePath}/developer/design-handoff` },
          { icon: GitPullRequest, label: 'Implementation Submissions', path: `${basePath}/developer/submissions` },
        ]
      },
      {
        category: 'Quality and Issues',
        items: [
          { icon: Bug, label: 'Defects & Bug Fixes', path: `${basePath}/developer/defects` },
          { icon: AlertOctagon, label: 'Blockers & Dependencies', path: `${basePath}/developer/blockers` },
        ]
      },
      {
        category: 'Product Context',
        items: [
          { icon: Compass, label: 'Product Context', path: `${basePath}/developer/product-context` },
          { icon: Lightbulb, label: 'Customer Insights', path: `${basePath}/intelligence/insights` },
          { icon: Star, label: 'Related Features', path: `${basePath}/features` },
        ]
      },
      {
        category: 'Assistance',
        items: [
          { icon: Sparkles, label: 'AI Assistant', path: `${basePath}/assistant` },
        ]
      }
    ];
    workspaceNavItems = [
      { icon: LayoutGrid, label: 'Workspace Overview', path: `${basePath}/dashboard` },
    ];
  } else if (isQA) {
    roleHeader = 'QA LEAD / TESTER';
    brandLink = `${basePath}/qa/dashboard`;
    navItems = [
      {
        category: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'QA Dashboard', path: `${basePath}/qa/dashboard` }
        ]
      },
      {
        category: 'Testing',
        items: [
          { icon: ListTodo, label: 'My Test Assignments', path: `${basePath}/qa/assignments` },
          { icon: FileText, label: 'Test Plans', path: `${basePath}/qa/test-plans` },
          { icon: CheckSquare, label: 'Test Cases', path: `${basePath}/qa/test-cases` },
          { icon: Layers, label: 'Test Suites', path: `${basePath}/qa/test-suites` },
          { icon: Activity, label: 'Test Execution', path: `${basePath}/qa/test-execution` },
          { icon: RotateCcw, label: 'Regression Testing', path: `${basePath}/qa/regression-testing` }
        ]
      },
      {
        category: 'Quality Management',
        items: [
          { icon: Bug, label: 'Defects & Bugs', path: `${basePath}/qa/defects` },
          { icon: GitPullRequest, label: 'Retesting Queue', path: `${basePath}/qa/retesting-queue` },
          { icon: BarChart2, label: 'QA Reports', path: `${basePath}/qa/reports` },
          { icon: ShieldCheck, label: 'Release Readiness', path: `${basePath}/qa/release-readiness` }
        ]
      },
      {
        category: 'Requirements and Context',
        items: [
          { icon: FileText, label: 'Assigned PRDs', path: `${basePath}/qa/assigned-prds` },
          { icon: CheckSquare, label: 'Acceptance Criteria', path: `${basePath}/qa/acceptance-criteria` },
          { icon: Palette, label: 'Design Handoff', path: `${basePath}/qa/design-handoff` },
          { icon: Compass, label: 'Product Context', path: `${basePath}/qa/product-context` }
        ]
      },
      {
        category: 'Assistance',
        items: [
          { icon: Sparkles, label: 'AI Assistant', path: `${basePath}/assistant` }
        ]
      }
    ];
    workspaceNavItems = [
      { icon: LayoutGrid, label: 'Workspace Overview', path: `${basePath}/dashboard` },
    ];
  } else {
    // Stakeholder / Business Owner / Member default
    roleHeader = 'STAKEHOLDER';
    brandLink = `${basePath}/stakeholder/dashboard`;
    navItems = [
      {
        category: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'Stakeholder Dashboard', path: `${basePath}/stakeholder/dashboard` },
        ]
      },
      {
        category: 'Product and Business Context',
        items: [
          { icon: Compass, label: 'Product Overview', path: `${basePath}/stakeholder/product-overview` },
          { icon: Target, label: 'Business Objectives', path: `${basePath}/stakeholder/business-objectives` },
          { icon: Layers, label: 'Product Roadmap', path: `${basePath}/stakeholder/roadmap` },
          { icon: CheckSquare, label: 'Feature Portfolio', path: `${basePath}/stakeholder/roadmap#portfolio` },
          { icon: TrendingUp, label: 'Business Cases', path: `${basePath}/stakeholder/product-overview#business-cases` },
        ]
      },
      {
        category: 'Review and Decisions',
        items: [
          { icon: Clock, label: 'Pending Approvals', path: `${basePath}/stakeholder/approvals` },
          { icon: FileText, label: 'PRD Review', path: `${basePath}/stakeholder/prd-review` },
          { icon: MessageSquare, label: 'Business Feedback', path: `${basePath}/stakeholder/feedback` },
          { icon: ShieldCheck, label: 'Decision History', path: `${basePath}/stakeholder/decisions` },
        ]
      },
      {
        category: 'Performance and Risk',
        items: [
          { icon: Target, label: 'Milestones and Progress', path: `${basePath}/stakeholder/milestones` },
          { icon: TrendingUp, label: 'Business Impact', path: `${basePath}/stakeholder/metrics` },
          { icon: ShieldAlert, label: 'Risks and Dependencies', path: `${basePath}/stakeholder/risks` },
          { icon: BarChart2, label: 'Success Metrics', path: `${basePath}/stakeholder/metrics#success-metrics` },
        ]
      },
      {
        category: 'Assistance',
        items: [
          { icon: Sparkles, label: 'AI Assistant', path: `${basePath}/assistant` }
        ]
      }
    ];
    workspaceNavItems = [
      { icon: LayoutGrid, label: 'Workspace Overview', path: `${basePath}/dashboard` },
    ];
  }

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
    if (path.endsWith('/designer/dashboard')) {
      return location.pathname.endsWith('/designer/dashboard') || (isDesigner && location.pathname.endsWith('/my-dashboard'));
    }
    if (path.endsWith('/designer/assignments')) {
      return location.pathname.endsWith('/designer/assignments') || location.pathname.includes('/designer/assignments/');
    }
    if (path.endsWith('/developer/dashboard')) {
      return location.pathname.endsWith('/developer/dashboard') || (isDeveloper && location.pathname.endsWith('/my-dashboard'));
    }
    if (path.endsWith('/qa/dashboard')) {
      return location.pathname.endsWith('/qa/dashboard') || (isQA && location.pathname.endsWith('/my-dashboard'));
    }
    if (path.endsWith('/qa/assignments')) {
      return location.pathname.endsWith('/qa/assignments') || location.pathname.endsWith('/qa/my-assignments');
    }
    if (path.endsWith('/my-dashboard')) {
      return location.pathname.endsWith('/my-dashboard');
    }
    if (path.endsWith('/stakeholder/dashboard')) {
      return location.pathname.endsWith('/stakeholder/dashboard') || (isStakeholder && location.pathname.endsWith('/my-dashboard'));
    }
    if (path.includes('/stakeholder/')) {
      if (path.includes('#')) {
        const [base, hash] = path.split('#');
        return location.pathname === base && location.hash === `#${hash}`;
      }
      return location.pathname === path && !location.hash;
    }
    if (path.includes('/developer/assignments') && !path.includes('/assignments/')) {
      return location.pathname === path;
    }
    if (path.includes('/features')) {
      return location.pathname.includes('/features');
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside className={`prodai-sidebar sidebar-responsive ${
        mobileOpen ? 'sidebar-open' : 'sidebar-closed'
      } lg:translate-x-0 ${isCollapsed ? 'w-[74px]' : 'w-[250px]'} h-screen backdrop-blur-xl flex flex-col justify-between py-4 px-3 shrink-0 font-sans transition-[width,transform] duration-300 z-50 select-none relative`}>
        
        {/* Top Brand */}
        <div className="min-h-0 flex flex-col flex-1 overflow-hidden">
          <div className={`flex items-center justify-between ${isCollapsed ? 'justify-center' : 'px-2'} mb-4 group`}>
            <Link 
              to={brandLink} 
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 min-w-0"
              title="ProdAI - Product Intelligence Assistant"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-purple-500/30 overflow-hidden shadow-md shadow-[#5b3df5]/30">
                <img src="/logo.png" alt="ProdAI Logo" className="w-full h-full object-cover" />
              </div>
              {!isCollapsed && (
                <div className="flex min-w-0 flex-col">
                  <span className={`truncate text-[15px] font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>ProdAI</span>
                  <span className={`truncate text-[10px] font-medium tracking-wide ${isDark ? 'text-[#A1A1B5]' : 'text-[var(--nav-muted)]'}`}>Product Intelligence Assistant</span>
                </div>
              )}
            </Link>

            <div className="flex items-center gap-1">
              {/* Close Button on Mobile */}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close navigation"
              >
                <ChevronLeft size={18} />
              </button>

              {!isCollapsed && (
                <button 
                  type="button" 
                  onClick={() => setIsCollapsed(true)}
                  className={`hidden lg:block p-1 transition-colors cursor-pointer ${isDark ? 'text-[#A1A1B5] hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
        </div>

        {/* Role Header Banner */}
        {!isCollapsed && (
          <div className="px-2.5 pb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider block ${isDark ? 'text-[#A1A1B5]' : 'text-[var(--nav-muted)]'}`}>
              {roleHeader}
            </span>
          </div>
        )}

        {/* Navigation links */}
        <nav className="space-y-2 overflow-y-auto scrollbar-hide flex-1 pr-0.5">
          {navItems.map((entry, groupIdx) => {
            // Grouped Category layout (for PM) or flat item (for other roles)
            if (entry.category && Array.isArray(entry.items)) {
              return (
                <div key={entry.category} className="space-y-1">
                  {!isCollapsed && (
                    <div className="pt-2.5 pb-1 px-3">
                      <span className={`text-[10px] font-black uppercase tracking-wider block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {entry.category}
                      </span>
                    </div>
                  )}
                  {entry.items.map(({ icon: Icon, label, path, badge, subItems }) => {
                    const active = isActive(path);
                    const isExpanded = active && !isCollapsed && subItems && subItems.length > 0;
                    return (
                      <div key={label} className="space-y-1">
                        <Link
                          to={path}
                          title={isCollapsed ? label : undefined}
                          className={`prodai-nav-item flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-200 group relative ${isCollapsed ? 'justify-center' : 'justify-between'} ${
                            active 
                              ? 'prodai-nav-active font-semibold'
                              : isDark
                                ? 'text-[#A1A1B5] hover:text-slate-100 font-medium'
                                : 'text-[var(--nav-text)] hover:text-slate-900 font-medium'
                          }`}
                        >
                          {/* Active accent indicator along active item left edge */}
                          {active && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full" style={{ background: 'var(--nav-active-indicator)', boxShadow: '0 0 8px rgba(168,85,247,0.6)' }} />
                          )}
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon size={16} className={`prodai-nav-icon transition-colors duration-200 ${active ? '' : isDark ? 'text-[#A1A1B5] group-hover:text-slate-200' : 'text-[var(--nav-muted)] group-hover:text-slate-800'}`} />
                            {!isCollapsed && <span className="truncate">{label}</span>}
                          </div>
                          {!isCollapsed && badge && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              badge === 'DEV'
                                ? active
                                  ? 'bg-cyan-400 text-slate-900 border border-cyan-300 shadow-xs'
                                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : badge === 'PM'
                                ? active
                                  ? 'bg-amber-400 text-slate-900 border border-amber-300 shadow-xs'
                                  : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                : badge === 'Gate'
                                ? active
                                  ? 'bg-emerald-400 text-slate-900 border border-emerald-300 shadow-xs'
                                  : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                                : active
                                ? 'bg-purple-400 text-slate-900 border border-purple-300 shadow-xs'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}>
                              {badge}
                            </span>
                          )}
                          {!isCollapsed && active && !subItems && !badge && (
                            <ChevronRight size={14} className="shrink-0 text-white/90" />
                          )}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Flat single item
            const { icon: Icon, label, path, badge, subItems } = entry;
            const active = isActive(path);
            const isExpanded = active && !isCollapsed && subItems && subItems.length > 0;

            return (
              <div key={label} className="space-y-1">
                <Link
                  to={path}
                  title={isCollapsed ? label : undefined}
                  className={`prodai-nav-item flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-200 group relative ${isCollapsed ? 'justify-center' : 'justify-between'} ${
                    active 
                      ? 'prodai-nav-active font-semibold'
                      : isDark
                        ? 'text-[#A1A1B5] hover:text-slate-100 font-medium'
                        : 'text-[var(--nav-text)] hover:text-slate-900 font-medium'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full" style={{ background: 'var(--nav-active-indicator)', boxShadow: '0 0 8px rgba(168,85,247,0.6)' }} />
                  )}
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className={`prodai-nav-icon transition-colors duration-200 ${active ? '' : isDark ? 'text-[#A1A1B5] group-hover:text-slate-200' : 'text-[var(--nav-muted)] group-hover:text-slate-800'}`} />
                    {!isCollapsed && <span className="truncate">{label}</span>}
                  </div>
                  {!isCollapsed && active && !subItems && (
                    <ChevronRight size={14} className="shrink-0 text-white/90" />
                  )}
                </Link>
              </div>
            );
          })}

          {/* WORKSPACE SECTION */}
          {!isCollapsed && (
            <div className="pt-3 pb-1 px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--nav-muted)' }}>
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
                className={`prodai-nav-item flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-200 group relative ${isCollapsed ? 'justify-center' : 'justify-between'} ${
                  active
                    ? 'prodai-nav-active font-semibold'
                    : isDark
                      ? 'text-[#A1A1B5] hover:text-slate-100 font-medium'
                      : 'text-[var(--nav-text)] hover:text-slate-900 font-medium'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full" style={{ background: 'var(--nav-active-indicator)', boxShadow: '0 0 8px rgba(168,85,247,0.6)' }} />
                )}
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={16} className={`prodai-nav-icon transition-colors duration-200 ${active ? '' : isDark ? 'text-[#A1A1B5] group-hover:text-slate-200' : 'text-[var(--nav-muted)] group-hover:text-slate-800'}`} />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </div>
                {!isCollapsed && active && (
                  <ChevronRight size={14} className="shrink-0 text-white/90" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom widgets */}
      <div className="mt-2 space-y-2.5 pt-2 border-t shrink-0 relative" style={{ borderColor: 'var(--nav-border)' }}>
        {!isCollapsed && (
          <>
            {/* Current Workspace Card with Switcher Popup Trigger */}
            <div className="relative">
              <div 
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className="prodai-ws-card border rounded-xl p-2.5 cursor-pointer transition-all flex items-center justify-between hover:opacity-90"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeWorkspace.name}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{activeWorkspace.members_count ?? activeWorkspace.membersCount ?? 1} Members</p>
                  </div>
                </div>
                <ChevronDown size={14} className={`transition-transform ${isDark ? 'text-slate-400' : 'text-slate-500'} ${isSwitcherOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Workspace Switcher Popup Menu */}
              {isSwitcherOpen && (
                <div className={`absolute bottom-full left-0 mb-2 w-64 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 ${
                  isDark
                    ? 'bg-[#090d1c]/95 border border-white/[0.08] backdrop-blur-xl'
                    : 'bg-white border border-slate-200 shadow-xl'
                }`}>
                  <div className="flex items-center justify-between px-2.5 py-2 border-b mb-1" style={{ borderColor: 'var(--nav-border)' }}>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Switch Workspace</span>
                    {isPm && (
                      <Link
                        to="/workspaces/new"
                        onClick={() => setIsSwitcherOpen(false)}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                        title="Create Workspace"
                      >
                        <Plus size={14} />
                      </Link>
                    )}
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                    {workspaces.map((ws) => {
                      const wsIdentifier = ws.id || ws._id;
                      const isCurrent = wsIdentifier === (activeWorkspace.id || activeWorkspace._id);
                      return (
                        <Link
                          key={wsIdentifier}
                          to={getWorkspaceSwitchTarget(wsIdentifier)}
                          onClick={() => {
                            cancelWorkspacePrefetch();
                            setActiveWorkspaceId(wsIdentifier);
                            setActiveWsId(wsIdentifier);
                            setIsSwitcherOpen(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                            isCurrent
                              ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                              : isDark
                                ? 'text-slate-300 hover:bg-white/[0.04]'
                                : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                              <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
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
                              <span className={`text-[9px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ws.members_count ?? ws.membersCount ?? 1} Members</span>
                            </div>
                          </div>
                          {isCurrent && <ChevronRight size={13} className="text-white shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>

                  {isPm && (
                    <div className="pt-1.5 mt-1 border-t" style={{ borderColor: 'var(--nav-border)' }}>
                      <Link
                        to="/workspaces"
                        onClick={() => setIsSwitcherOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Settings size={13} />
                        <span>Manage Workspaces</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Storage Meter */}
            <div className="space-y-1 px-1">
              <div className="flex items-center justify-between text-xs">
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Storage</span>
                <span className={`font-bold text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>78%</span>
              </div>
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-slate-200'}`}>
                <div className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full w-[78%]"></div>
              </div>
              <div className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>7.8 GB / 10 GB</div>
            </div>

            {/* User Profile Bar */}
            <div className="pt-1.5 border-t flex items-center justify-between px-1" style={{ borderColor: 'var(--nav-border)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentUser.name}</p>
                  <p className="text-[10px] truncate leading-tight capitalize" style={{ color: 'var(--nav-muted)' }}>{currentUser.roleTitle}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1 text-xs transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          style={{ color: 'var(--nav-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--nav-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--nav-muted)'}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {!isCollapsed && <span className="text-[11px] font-medium">Collapse</span>}
        </button>
      </div>

    </aside>
    </>
  );
}

