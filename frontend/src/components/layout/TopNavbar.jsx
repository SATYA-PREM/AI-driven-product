import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, HelpCircle, ChevronDown, 
  Layers, LogOut, Settings, UserCheck, Database, Sparkles, Filter, X, Menu
} from 'lucide-react';
import { 
  getCurrentUser, logoutUser, getStoredWorkspaces, setStoredWorkspaces,
  getWorkspaceById, setCurrentUser, setActiveWorkspaceId, getActiveWorkspaceId,
  subscribeToActiveWorkspace,
  getActiveDatasetId, setActiveDatasetId, subscribeToActiveDataset,
  setActiveDataset, getActiveDataset,
  getActiveSourceType, setActiveSourceType, subscribeToActiveSourceType,
  isProductManager
} from '../../utils/workspaceAccess';
import { datasetApi } from '../../api/datasets';
import { workspaceApi } from '../../api/workspaces';
import ThemeToggle from '../common/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

export default function TopNavbar({ isDark: propIsDark, onMenuToggle = () => {} }) {
  const { workspaceId: routeWorkspaceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWsMenu, setShowWsMenu] = useState(false);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const wsMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Workspaces state connected to backend API
  const [workspaces, setWorkspaces] = useState(() => getStoredWorkspaces());
  const [activeWsId, setActiveWsId] = useState(() => routeWorkspaceId || getActiveWorkspaceId());

  // Source Type and Dataset Batch Scope State
  const [selectedSourceType, setSelectedSourceType] = useState(() => getActiveSourceType());
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId());

  const currentUser = getCurrentUser();

  // Sync route param with activeWsId
  useEffect(() => {
    if (routeWorkspaceId && routeWorkspaceId !== activeWsId) {
      setActiveWsId(routeWorkspaceId);
      setActiveWorkspaceId(routeWorkspaceId);
    }
  }, [routeWorkspaceId]);

  // Subscribe to external workspace switch
  useEffect(() => {
    const unsubWs = subscribeToActiveWorkspace((newWsId) => {
      setActiveWsId(newWsId);
    });
    return unsubWs;
  }, []);

  // Fetch workspaces from backend
  const loadWorkspaces = () => {
    workspaceApi.listWorkspaces()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setWorkspaces(data);
          setStoredWorkspaces(data);
          const currentId = getActiveWorkspaceId();
          if (!currentId || currentId === 'ws_demo_01' || !data.some((w) => (w.id || w._id) === currentId)) {
            const firstId = data[0].id || data[0]._id;
            setActiveWorkspaceId(firstId);
            setActiveWsId(firstId);
          }
        }
      })
      .catch((err) => console.warn('TopNavbar listWorkspaces error:', err?.message));
  };

  useEffect(() => {
    loadWorkspaces();
    window.addEventListener('workspaces_updated', loadWorkspaces);
    return () => window.removeEventListener('workspaces_updated', loadWorkspaces);
  }, []);

  // Subscribe to active dataset and source type changes
  useEffect(() => {
    const unsubDataset = subscribeToActiveDataset((newDsId) => setSelectedDatasetId(newDsId));
    const unsubSourceType = subscribeToActiveSourceType((newSt) => setSelectedSourceType(newSt));
    return () => {
      unsubDataset();
      unsubSourceType();
    };
  }, []);

  // Load datasets for current active workspace
  const loadWorkspaceDatasets = () => {
    const targetWs = activeWsId || (workspaces[0]?.id || workspaces[0]?._id);
    if (!targetWs || targetWs === 'ws_demo_01') return;
    datasetApi.list(targetWs)
      .then((dsRes) => {
        if (Array.isArray(dsRes)) {
          setDatasets(dsRes);
          const currentActive = getActiveDatasetId();
          if (currentActive) {
            const found = dsRes.find((d) => (d.id || d._id) === currentActive);
            if (found) {
              setActiveDataset(found);
            }
          }
        }
      })
      .catch((err) => console.warn('TopNavbar datasets notice:', err?.message));
  };

  useEffect(() => {
    loadWorkspaceDatasets();
    window.addEventListener('datasets_updated', loadWorkspaceDatasets);
    return () => window.removeEventListener('datasets_updated', loadWorkspaceDatasets);
  }, [activeWsId]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wsMenuRef.current && !wsMenuRef.current.contains(e.target)) {
        setShowWsMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSourceTypeChange = (e) => {
    const val = e.target.value;
    setSelectedSourceType(val);
    setActiveSourceType(val);
  };

  const handleDatasetChange = (e) => {
    const val = e.target.value;
    setSelectedDatasetId(val);
    const found = datasets.find((d) => (d.id || d._id) === val) || null;
    setActiveDatasetId(val, found);
  };

  // Filter datasets based on selected source type
  const filteredDatasets = datasets.filter((d) => {
    if (!selectedSourceType || selectedSourceType === 'all') return true;
    const sType = String(d.source_type || d.source || '').toLowerCase();
    const fName = String(d.filename || d.name || '').toLowerCase();
    if (selectedSourceType === 'feedback') return sType.includes('feedback') || (!sType && fName.includes('feedback'));
    if (selectedSourceType === 'support_tickets') return sType.includes('support') || sType.includes('ticket') || sType.includes('zendesk');
    if (selectedSourceType === 'reviews') return sType.includes('review') || sType.includes('app') || sType.includes('play');
    if (selectedSourceType === 'surveys') return sType.includes('survey') || sType.includes('nps');
    if (selectedSourceType === 'social_media') return sType.includes('social') || sType.includes('media') || sType.includes('twitter');
    if (selectedSourceType === 'feature_requests') return sType.includes('feature') || sType.includes('request');
    return sType === selectedSourceType.toLowerCase();
  });

  // Source type counts
  const sourceCounts = datasets.reduce((acc, d) => {
    const sType = String(d.source_type || d.source || 'feedback').toLowerCase();
    acc[sType] = (acc[sType] || 0) + 1;
    return acc;
  }, {});

  const currentWorkspace = workspaces.find((w) => (w.id || w._id) === activeWsId) || (workspaces.length > 0 ? workspaces[0] : null);
  const currentWorkspaceName = currentWorkspace?.name || (workspaces.length > 0 ? workspaces[0].name : 'Workspace');
  const wsId = activeWsId || (currentWorkspace ? (currentWorkspace.id || currentWorkspace._id) : '') || routeWorkspaceId || getActiveWorkspaceId();

  const getPageTitle = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length <= 2) return 'PM Dashboard';
    const last = paths[paths.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1).replace('-', ' ');
  };

  const getWorkspaceSwitchTarget = (targetWsId) => {
    if (location.pathname.startsWith('/workspace/')) {
      const parts = location.pathname.split('/');
      if (parts.length > 3 && parts[3]) {
        const subpath = parts.slice(3).join('/');
        return `/workspace/${targetWsId}/${subpath}`;
      }
    }
    const role = String(currentUser?.role || '').toLowerCase();
    if (['designer', 'product_designer', 'ux'].includes(role)) {
      return `/workspace/${targetWsId}/designer/dashboard`;
    }
    if (['developer', 'dev', 'engineer', 'lead_engineer'].includes(role)) {
      return `/workspace/${targetWsId}/developer/dashboard`;
    }
    if (['qa', 'tester'].includes(role)) {
      return `/workspace/${targetWsId}/qa/dashboard`;
    }
    if (['stakeholder', 'business'].includes(role)) {
      return `/workspace/${targetWsId}/stakeholder/dashboard`;
    }
    return `/workspace/${targetWsId}/pm-dashboard`;
  };

  const handleSwitchWorkspace = (newId) => {
    setActiveWorkspaceId(newId);
    setActiveWsId(newId);
    setShowWsMenu(false);
    navigate(getWorkspaceSwitchTarget(newId));
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowUserMenu(false);
        setShowWsMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (showSearchModal && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearchModal]);

  // Quick search items navigation
  const searchCategories = [
    { label: 'PM Dashboard', path: `/workspace/${activeWsId}/pm-dashboard`, category: 'Navigation' },
    { label: 'Customer Feedback', path: `/workspace/${activeWsId}/feedback`, category: 'Data' },
    { label: 'Critical Issues', path: `/workspace/${activeWsId}/intelligence/issues`, category: 'Intelligence' },
    { label: 'Feature Opportunities', path: `/workspace/${activeWsId}/features`, category: 'Product' },
    { label: 'PRD Management', path: `/workspace/${activeWsId}/development/prd`, category: 'Product' },
    { label: 'Datasets Studio', path: `/workspace/${activeWsId}/data/datasets`, category: 'Data' },
    { label: 'Workspace Settings', path: `/workspace/${activeWsId}/settings`, category: 'Settings' },
  ];

  const filteredSearch = searchQuery.trim()
    ? searchCategories.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : searchCategories;

  return (
    <header className={`prodai-topbar h-16 px-4 sm:px-6 lg:px-8 backdrop-blur-xl flex items-center justify-between shrink-0 z-20 select-none transition-colors duration-200 ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      
      {/* Left: Mobile Menu Toggle + Workspace, Source Type & Batch Breadcrumbs */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
        {/* Mobile/Tablet Menu Hamburger Button */}
        <button
          type="button"
          onClick={onMenuToggle}
          className={`lg:hidden p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
            isDark 
              ? 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08]' 
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-200'
          }`}
          title="Open Navigation"
          aria-label="Open Navigation"
        >
          <Menu className="w-4 h-4 text-purple-500" />
        </button>

        <Link 
          to="/workspaces"
          className={`text-xs font-semibold hidden md:flex items-center gap-1.5 transition-colors shrink-0 ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-500" />
          <span>Workspaces</span>
        </Link>

        <span className={`hidden md:inline ${isDark ? "text-slate-600" : "text-slate-300"}`}>/</span>

        {/* Workspace Switcher */}
        <div className="relative shrink min-w-0" ref={wsMenuRef}>
          <button
            type="button"
            onClick={() => setShowWsMenu(!showWsMenu)}
            className={`flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer px-2.5 sm:px-3 py-1.5 rounded-xl border max-w-full ${
              isDark 
                ? 'bg-white/[0.04] border-white/[0.08] text-white hover:text-purple-300 hover:border-white/[0.15]' 
                : 'bg-slate-100 border-slate-200 text-slate-800 hover:text-purple-600 hover:border-slate-300'
            }`}
          >
            <span className="truncate max-w-[85px] xs:max-w-[120px] sm:max-w-[170px]">{currentWorkspaceName}</span>
            <ChevronDown size={12} className={`shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
          </button>

          {/* Workspace dropdown */}
          {showWsMenu && (
            <div className={`absolute top-full left-0 mt-2 w-64 rounded-2xl border backdrop-blur-xl shadow-2xl p-2 z-50 text-xs ${
              isDark ? 'bg-[#090d1c]/95 border-white/[0.08]' : 'bg-white/95 border-slate-200 shadow-xl'
            }`}>
              <div className={`flex items-center justify-between px-2.5 py-1 mb-1 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
                <span className={`text-[10px] font-bold uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Switch Workspace
                </span>
                <span className="text-[10px] text-purple-400 font-semibold font-mono">{workspaces.length} Available</span>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {workspaces.map((ws) => {
                  const wid = ws.id || ws._id;
                  const isCur = wid === activeWsId;
                  return (
                    <button
                      key={wid}
                      type="button"
                      onClick={() => handleSwitchWorkspace(wid)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        isCur 
                          ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20' 
                          : isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate font-semibold">{ws.name}</span>
                      {isCur && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono shrink-0 ml-2">Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Filter Button for Source & Batch Selection */}
        <button
          type="button"
          onClick={() => setShowMobileFilterModal(true)}
          className={`sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shrink-0 transition-colors ${
            (selectedSourceType !== 'all' || selectedDatasetId)
              ? 'bg-purple-600/15 border-purple-500/40 text-purple-400'
              : isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
          title="Filter by Source Type & Batch"
        >
          <Filter size={12} className="text-purple-500 shrink-0" />
          <span className="text-[11px] max-w-[65px] truncate">
            {selectedSourceType !== 'all' ? selectedSourceType : (selectedDatasetId ? 'Batch' : 'Filter')}
          </span>
          {(selectedSourceType !== 'all' || selectedDatasetId) && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
          )}
        </button>

        <span className={`hidden sm:inline ${isDark ? "text-slate-600" : "text-slate-300"}`}>/</span>

        {/* 1. Source Type Selector (Desktop & Tablet) */}
        <div className={`hidden sm:flex items-center gap-1.5 border px-2.5 py-1.5 rounded-xl text-xs shrink-0 ${
          isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
        }`}>
          <Filter size={12} className="text-purple-500 shrink-0" />
          <select
            value={selectedSourceType || 'all'}
            onChange={handleSourceTypeChange}
            className={`bg-transparent text-[11px] font-semibold border-none outline-none cursor-pointer focus:ring-0 max-w-[130px] lg:max-w-[160px] truncate ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
            title="Feedback Source Type"
          >
            <option value="all" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
              All Sources ({datasets.length})
            </option>
            <option value="feedback" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
              Customer Feedback {sourceCounts['feedback'] ? `(${sourceCounts['feedback']})` : ''}
            </option>
            <option value="support_tickets" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
              Support Tickets {sourceCounts['support_tickets'] ? `(${sourceCounts['support_tickets']})` : ''}
            </option>
            <option value="reviews" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
              App Reviews {sourceCounts['reviews'] ? `(${sourceCounts['reviews']})` : ''}
            </option>
            <option value="surveys" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
              Surveys {sourceCounts['surveys'] ? `(${sourceCounts['surveys']})` : ''}
            </option>
            <option value="social_media" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
              Social Media {sourceCounts['social_media'] ? `(${sourceCounts['social_media']})` : ''}
            </option>
            <option value="feature_requests" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
              Feature Requests {sourceCounts['feature_requests'] ? `(${sourceCounts['feature_requests']})` : ''}
            </option>
          </select>
        </div>

        <span className={`hidden md:inline ${isDark ? "text-slate-600" : "text-slate-300"}`}>/</span>

        {/* 2. Feedback Batch / Dataset Scope Selector (Desktop & Tablet) */}
        <div className={`hidden md:flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-xs shrink-0 ${
          isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
        }`}>
          <Database size={12} className="text-cyan-500 shrink-0" />
          <select
            value={selectedDatasetId || ''}
            onChange={handleDatasetChange}
            className={`bg-transparent text-[11px] font-semibold border-none outline-none cursor-pointer focus:ring-0 max-w-[150px] lg:max-w-[220px] truncate ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
            title="Feedback Batch / Dataset Scope"
          >
            <option value="" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
              {filteredDatasets.length > 0 ? `All Batches (${filteredDatasets.length})` : 'All Batches (0)'}
            </option>
            {filteredDatasets.map((d) => {
              const dsid = d.id || d._id;
              const name = d.dataset_name || d.name || d.filename || d.file_name || 'Feedback Batch';
              const rows = d.record_count || d.total_rows || 0;
              return (
                <option key={dsid} value={dsid} className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
                  {name} ({rows} rows)
                </option>
              );
            })}
          </select>
        </div>

        <span className={`hidden xl:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>/</span>
        <span className="hidden xl:inline text-xs font-semibold text-purple-500 truncate max-w-[180px]">{getPageTitle()}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        
        {/* Consistent Light/Dark Mode Sliding Toggle */}
        <ThemeToggle />

        {/* Search button with Ctrl+K badge */}
        <button 
          type="button"
          onClick={() => setShowSearchModal(true)}
          className={`flex items-center gap-2 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
            isDark 
              ? 'text-slate-400 hover:text-white bg-white/[0.02] border-white/[0.08] hover:border-white/[0.15]' 
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
          title="Search (Ctrl + K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px] text-slate-400">Search</span>
          <kbd className={`hidden md:inline text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            isDark ? 'bg-white/[0.06] border-white/[0.1] text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'
          }`}>
            Ctrl K
          </kbd>
        </button>

        {/* Notifications */}
        <button 
          type="button"
          className={`relative p-2 rounded-xl transition-all cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className={`absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ${
            isDark ? 'ring-[#04060d]' : 'ring-white'
          }`} />
        </button>

        {/* Help - Hidden on mobile, visible on sm+ */}
        <button 
          type="button"
          className={`hidden sm:flex p-2 rounded-xl transition-all cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Help & Guides"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile */}
        <div className="relative shrink-0" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              isDark 
                ? 'border-white/[0.08] bg-white/[0.04] hover:border-purple-500/40 text-white' 
                : 'border-slate-200 bg-slate-100 hover:border-purple-500/40 text-slate-900'
            }`}
          >
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className={`w-6 h-6 rounded-lg object-cover ring-1 ${isDark ? 'ring-white/10' : 'ring-slate-300'}`}
            />
            <div className="text-left hidden md:block">
              <p className={`text-xs font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentUser.name}</p>
              <p className="text-[10px] text-purple-500 font-medium leading-tight mt-0.5">{currentUser.roleTitle}</p>
            </div>
            <ChevronDown size={12} className={isDark ? "text-slate-400 ml-0.5" : "text-slate-500 ml-0.5"} />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className={`absolute right-0 top-full mt-2 w-56 rounded-2xl border backdrop-blur-xl shadow-2xl p-1.5 z-50 text-xs animate-fadeIn ${
              isDark ? 'bg-[#090d1c]/95 border-white/[0.08]' : 'bg-white/95 border-slate-200 shadow-lg'
            }`}>
              <div className={`px-3 py-2 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentUser.name}</p>
                <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded text-[9px] font-bold">
                  {currentUser.roleTitle}
                </span>
              </div>

              {isProductManager(currentUser) && (
                <div className="py-1">
                  <Link
                    to={`/workspace/${wsId}/settings`}
                    onClick={() => setShowUserMenu(false)}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition-colors ${
                      isDark ? 'text-slate-300 hover:bg-white/[0.04] hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Settings size={14} className={isDark ? "text-slate-400" : "text-slate-500"} />
                    <span>Workspace Settings</span>
                  </Link>
                </div>
              )}

              <div className={`pt-1 ${isProductManager(currentUser) ? `border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}` : ''}`}>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Global Quick Search Modal (Cmd/Ctrl + K) */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ${
              isDark ? 'bg-[#090d1c] border-white/[0.12] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Search Input Bar */}
            <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <Search className="w-4 h-4 text-purple-500 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, feedback, issues, PRDs, settings..."
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="sm:hidden p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label="Close search"
              >
                <X size={16} />
              </button>
              <kbd className={`hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                isDark ? 'bg-white/[0.06] border-white/[0.1] text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}>
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filteredSearch.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching destinations found for "{searchQuery}".
                </div>
              ) : (
                filteredSearch.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setShowSearchModal(false);
                      setSearchQuery('');
                      navigate(item.path);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-white/[0.04] text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sparkles size={14} className="text-purple-400 shrink-0" />
                      <span className="font-semibold truncate">{item.label}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                      isDark ? 'bg-white/[0.04] border-white/[0.08] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      {item.category}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className={`px-4 py-2 border-t text-[11px] flex items-center justify-between ${
              isDark ? 'border-white/[0.06] text-slate-500 bg-black/20' : 'border-slate-100 text-slate-400 bg-slate-50'
            }`}>
              <span>Quick navigation across workspace assets</span>
              <span>Press <kbd className="font-mono text-[9px] px-1 rounded border">ESC</kbd> to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Modal for Source & Batch Selection */}
      {showMobileFilterModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md sm:hidden animate-fadeIn"
          onClick={() => setShowMobileFilterModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border p-4 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-[#0e1326] border-white/[0.12] text-white shadow-purple-950/50' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <div className={`flex items-center justify-between pb-2.5 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-purple-400" />
                <h3 className="font-bold text-sm">Filter Scope</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowMobileFilterModal(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-label="Close filter modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Source Type Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                1. Source Type
              </label>
              <div className={`flex items-center gap-2 border px-3 py-2 rounded-xl text-xs ${
                isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
              }`}>
                <Filter size={14} className="text-purple-500 shrink-0" />
                <select
                  value={selectedSourceType || 'all'}
                  onChange={handleSourceTypeChange}
                  className={`bg-transparent text-xs font-semibold border-none outline-none cursor-pointer focus:ring-0 w-full ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  <option value="all" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
                    All Sources ({datasets.length})
                  </option>
                  <option value="feedback" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
                    Customer Feedback {sourceCounts['feedback'] ? `(${sourceCounts['feedback']})` : ''}
                  </option>
                  <option value="support_tickets" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
                    Support Tickets {sourceCounts['support_tickets'] ? `(${sourceCounts['support_tickets']})` : ''}
                  </option>
                  <option value="reviews" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
                    App Reviews {sourceCounts['reviews'] ? `(${sourceCounts['reviews']})` : ''}
                  </option>
                  <option value="surveys" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
                    Surveys {sourceCounts['surveys'] ? `(${sourceCounts['surveys']})` : ''}
                  </option>
                  <option value="social_media" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
                    Social Media {sourceCounts['social_media'] ? `(${sourceCounts['social_media']})` : ''}
                  </option>
                  <option value="feature_requests" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
                    Feature Requests {sourceCounts['feature_requests'] ? `(${sourceCounts['feature_requests']})` : ''}
                  </option>
                </select>
              </div>
            </div>

            {/* Batch / Dataset Scope Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                2. Dataset Batch
              </label>
              <div className={`flex items-center gap-2 border px-3 py-2 rounded-xl text-xs ${
                isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
              }`}>
                <Database size={14} className="text-cyan-500 shrink-0" />
                <select
                  value={selectedDatasetId || ''}
                  onChange={handleDatasetChange}
                  className={`bg-transparent text-xs font-semibold border-none outline-none cursor-pointer focus:ring-0 w-full ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  <option value="" className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
                    {filteredDatasets.length > 0 ? `All Batches (${filteredDatasets.length})` : 'All Batches (0)'}
                  </option>
                  {filteredDatasets.map((d) => {
                    const dsid = d.id || d._id;
                    const name = d.dataset_name || d.name || d.filename || d.file_name || 'Feedback Batch';
                    const rows = d.record_count || d.total_rows || 0;
                    return (
                      <option key={dsid} value={dsid} className={isDark ? "bg-[#090d1c] text-white" : "bg-white text-slate-900"}>
                        {name} ({rows} rows)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilterModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer mt-3"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </header>
  );
}