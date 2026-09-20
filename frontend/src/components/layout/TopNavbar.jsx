import { useState, useEffect } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, HelpCircle, ChevronDown, 
  Layers, LogOut, Settings, UserCheck, Database, Sparkles
} from 'lucide-react';
import { 
  getCurrentUser, logoutUser, getStoredWorkspaces, 
  getWorkspaceById, setCurrentUser, setActiveWorkspaceId,
  getActiveDatasetId, setActiveDatasetId, subscribeToActiveDataset,
  setActiveDataset, getActiveDataset
} from '../../utils/workspaceAccess';
import { datasetApi } from '../../api/client';

export default function TopNavbar({ isDark = true }) {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = routeWorkspaceId || localStorage.getItem('active_workspace_id');
  const location = useLocation();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWsMenu, setShowWsMenu] = useState(false);

  // Dataset Batch Scope State
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId());

  const currentUser = getCurrentUser();
  const workspaces = getStoredWorkspaces();
  const currentWorkspace = getWorkspaceById(workspaceId);

  useEffect(() => {
    const unsubDataset = subscribeToActiveDataset((newDsId) => setSelectedDatasetId(newDsId));
    return () => {
      unsubDataset();
    };
  }, []);

  const loadWorkspaceDatasets = () => {
    if (!workspaceId) return;
    datasetApi.list(workspaceId)
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
  }, [workspaceId]);

  const handleDatasetChange = (e) => {
    const val = e.target.value;
    setSelectedDatasetId(val);
    const found = datasets.find((d) => (d.id || d._id) === val) || null;
    setActiveDatasetId(val, found);
  };

  const getPageTitle = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length <= 2) return 'PM Dashboard';
    const last = paths[paths.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1).replace('-', ' ');
  };

  const handleSwitchWorkspace = (newId) => {
    setActiveWorkspaceId(newId);
    setShowWsMenu(false);
    navigate(`/workspace/${newId}/overview`);
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
    <header className="h-16 px-6 lg:px-8 border-b border-[#171e30] bg-[#070910]/90 backdrop-blur-xl flex items-center justify-between shrink-0 z-20 select-none">
      
      {/* Left: Workspace & Context Breadcrumbs */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <Link 
          to="/workspaces"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <Layers className="w-4 h-4 text-[#8b5cf6]" />
          <span>Workspaces</span>
        </Link>

        <span className="text-slate-600">/</span>

        {/* Workspace Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowWsMenu(!showWsMenu)}
            className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#a78bfa] transition-colors cursor-pointer bg-[#121828] border border-[#202a42] px-3 py-1.5 rounded-lg"
          >
            <span className="truncate max-w-[140px] sm:max-w-[180px]">{currentWorkspace?.name || 'Workspace'}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {/* Workspace dropdown */}
          {showWsMenu && (
            <div className="absolute top-full left-0 mt-2 w-60 rounded-xl bg-[#121828] border border-[#202a42] shadow-2xl p-1.5 z-50 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 block">
                Switch Workspace
              </span>
              {workspaces.map((ws) => {
                const wid = ws.id || ws._id;
                const isCur = wid === workspaceId;
                return (
                  <button
                    key={wid}
                    type="button"
                    onClick={() => handleSwitchWorkspace(wid)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                      isCur 
                        ? 'bg-[#5b3df5] text-white font-bold' 
                        : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {isCur && <span className="text-[10px] font-mono">Active</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <span className="text-slate-600">/</span>

        {/* Feedback Batch Dataset Scope Selector */}
        <div className="flex items-center gap-1.5 bg-[#121828] border border-[#202a42] px-3 py-1.5 rounded-lg text-xs">
          <Database size={13} className="text-emerald-400 shrink-0" />
          <select
            value={selectedDatasetId}
            onChange={handleDatasetChange}
            className="bg-transparent text-white text-[11px] font-semibold border-none outline-none cursor-pointer focus:ring-0 max-w-[180px] sm:max-w-[260px] truncate"
            title="Feedback Batch / Dataset Scope"
          >
            <option value="" className="bg-[#121828] text-white">✨ All Feedback Batches</option>
            {datasets.map((d) => {
              const dsid = d.id || d._id;
              const name = d.dataset_name || d.name || d.filename || d.file_name || 'Feedback Batch';
              const rows = d.record_count || d.total_rows || 0;
              return (
                <option key={dsid} value={dsid} className="bg-[#121828] text-white">
                  📊 {name} ({rows} rows)
                </option>
              );
            })}
          </select>
        </div>

        <span className="hidden xl:inline text-slate-600">/</span>
        <span className="hidden xl:inline text-xs font-semibold text-[#8b5cf6]">{getPageTitle()}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        
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
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0" 
            />
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-bold text-white leading-tight truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 leading-tight truncate">{currentUser.roleTitle}</p>
            </div>
            <ChevronDown size={12} className="text-slate-500" />
          </div>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#131929] border border-[#212c45] rounded-xl shadow-2xl p-1.5 z-50 text-xs">
              <div className="px-2.5 py-2 border-b border-white/[0.06] mb-1">
                <p className="font-bold text-white">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>

              {currentUser.email !== 'pm@demo.com' && (
                <button
                  type="button"
                  onClick={handleSwitchToPM}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <UserCheck size={14} /> Switch to Priya Sharma (PM)
                </button>
              )}

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