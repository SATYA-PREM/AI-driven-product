import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Search, Bell, HelpCircle, Plus, Settings, 
  UserPlus, MessageSquare, ListTodo, Lightbulb, Users, Database, 
  ArrowUpRight, MoreVertical, X, Check, Trash2, Shield, 
  ExternalLink, Sparkles, Map, BarChart2, Layers
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { 
  getStoredWorkspaces, getCurrentUser, isProductManager, 
  assignMemberToWorkspace, removeMemberFromWorkspace, 
  addDataSourceToWorkspace, canAccessWorkspace, setCurrentUser
} from '../../utils/workspaceAccess';
import { availableTeamPool } from '../../mock/workspaces';

export default function WorkspaceList() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWsId, setActiveWsId] = useState('ecommerce-platform');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isNewWsOpen, setIsNewWsOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [selectedMemberMenu, setSelectedMemberMenu] = useState(null);

  // Invite member form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviteRoleTitle, setInviteRoleTitle] = useState('UX Designer');

  // New Workspace form state
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');

  // New Source form state
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceCount, setNewSourceCount] = useState('');

  const currentUser = getCurrentUser();
  const isPM = isProductManager();

  const loadData = () => {
    const allWorkspaces = getStoredWorkspaces();
    // Filter workspaces accessible by current user
    const accessible = allWorkspaces.filter((ws) => canAccessWorkspace(ws, currentUser));
    setWorkspaces(accessible);

    if (accessible.length > 0 && !accessible.find((w) => w.id === activeWsId)) {
      setActiveWsId(accessible[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeWsId) || workspaces[0];

  // Handle member assignment
  const handleAssignMember = (e) => {
    e.preventDefault();
    if (!inviteEmail || !activeWorkspace) return;

    const updated = assignMemberToWorkspace(activeWorkspace.id, {
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      roleTitle: inviteRoleTitle || inviteRole,
    });

    if (updated) {
      loadData();
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
    }
  };

  // Quick select from available candidates
  const handleSelectCandidate = (candidate) => {
    setInviteEmail(candidate.email);
    setInviteName(candidate.name);
    setInviteRoleTitle(candidate.roleTitle);
  };

  // Handle remove member
  const handleRemoveMember = (email) => {
    if (!activeWorkspace) return;
    removeMemberFromWorkspace(activeWorkspace.id, email);
    setSelectedMemberMenu(null);
    loadData();
  };

  // Handle create workspace
  const handleCreateWorkspace = (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    const id = newWsName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const newWs = {
      id,
      name: newWsName,
      status: 'Active',
      description: newWsDesc || 'Autonomous product intelligence workspace.',
      ownerEmail: currentUser.email,
      ownerName: currentUser.name,
      createdAt: 'Just now',
      membersCount: 1,
      members: [
        {
          id: `m_${Date.now()}`,
          name: currentUser.name,
          email: currentUser.email,
          role: 'Owner',
          roleTitle: currentUser.roleTitle || 'Product Manager (Owner)',
          avatar: currentUser.avatar,
          initials: currentUser.name.slice(0, 2).toUpperCase()
        }
      ],
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
        { id: 'ds_def', name: 'User Interviews', count: '0', icon: 'MessageSquare', color: 'text-blue-400 bg-blue-500/10' }
      ],
      recentActivity: [
        {
          id: `act_${Date.now()}`,
          activity: 'Workspace created',
          user: currentUser.name,
          avatar: currentUser.avatar,
          module: 'Workspace',
          moduleColor: 'bg-purple-950/70 text-purple-300 border-purple-800/50',
          time: 'Just now',
          icon: 'Layers'
        }
      ]
    };

    const stored = getStoredWorkspaces();
    const updated = [...stored, newWs];
    localStorage.setItem('mock_workspaces', JSON.stringify(updated));
    loadData();
    setActiveWsId(id);
    setIsNewWsOpen(false);
    setNewWsName('');
    setNewWsDesc('');
  };

  // Handle add data source
  const handleAddDataSource = (e) => {
    e.preventDefault();
    if (!newSourceName.trim() || !activeWorkspace) return;

    addDataSourceToWorkspace(activeWorkspace.id, {
      name: newSourceName,
      count: newSourceCount || '0'
    });

    loadData();
    setIsAddSourceOpen(false);
    setNewSourceName('');
    setNewSourceCount('');
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

  // If user has no access to any workspace
  if (!activeWorkspace) {
    return (
      <div className="flex h-screen bg-[#080a11] text-slate-100 font-sans overflow-hidden">
        <Sidebar workspaceId="" isDark={true} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#5b3df5]/10 border border-[#5b3df5]/30 flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-[#8b5cf6]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Workspace Assigned Yet</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            You are logged in as <span className="text-white font-semibold">{currentUser.email}</span>. You do not currently have access to any product workspace. Please ask your Product Manager (Priya Sharma) to assign you to a workspace.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSwitchToPM}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all cursor-pointer"
            >
              Switch to Priya Sharma (PM) to Assign Access
            </button>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 border border-white/[0.1] transition-all"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const membersList = activeWorkspace.members || [];
  const recentActivities = activeWorkspace.recentActivity || [];
  const dataSources = activeWorkspace.dataSources || [];
  const stats = activeWorkspace.stats || {
    totalFeedback: '12,842',
    feedbackGrowth: '+18.6%',
    totalFeatures: '56',
    featuresGrowth: '+12.0%',
    insightsGenerated: '128',
    insightsGrowth: '+15.7%',
    activeMembers: String(membersList.length),
    membersGrowth: '+20.0%',
    dataSources: String(dataSources.length),
    dataSourcesGrowth: '2 new'
  };

  return (
    <div className="flex h-screen bg-[#070910] text-slate-100 font-sans overflow-hidden">
      
      {/* Left Sidebar */}
      <Sidebar workspaceId={activeWorkspace.id} isDark={true} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#070910]">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#070910]/90 border-b border-[#161c2c] px-8 py-5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Workspaces</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage all your product workspaces in one place.</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative w-64 hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#101524] border border-[#1d263b] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] transition-all"
              />
            </div>

            {/* Notification Bell */}
            <button 
              type="button"
              className="relative p-2 rounded-xl bg-[#101524] border border-[#1d263b] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                8
              </span>
            </button>

            {/* Help */}
            <button 
              type="button"
              className="p-2 rounded-xl bg-[#101524] border border-[#1d263b] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Create Workspace Button (PM Only) */}
            {isPM && (
              <button
                type="button"
                onClick={() => setIsNewWsOpen(true)}
                className="px-4 py-2 rounded-xl font-semibold text-xs bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Create Workspace
              </button>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="p-8 max-w-[1400px] w-full mx-auto space-y-6">
          
          {/* Workspace Switcher Pills if multiple */}
          {workspaces.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-slate-400 font-semibold mr-1">Switch Workspace:</span>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => setActiveWsId(ws.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    ws.id === activeWorkspace.id
                      ? 'bg-[#5b3df5] text-white'
                      : 'bg-[#121726] text-slate-400 hover:text-white border border-[#1c2438]'
                  }`}
                >
                  {ws.name}
                </button>
              ))}
            </div>
          )}

          {/* 1. Hero Workspace Card (Image 1 top card) */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#0f1422] border border-[#1c253b] shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Left Details */}
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5b3df5] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#5b3df5]/30 shrink-0">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h2 className="text-xl font-bold text-white tracking-tight truncate">{activeWorkspace.name}</h2>
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#5b3df5]/20 text-[#a28bff] border border-[#5b3df5]/30 rounded-full">
                      {activeWorkspace.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mb-4">
                    {activeWorkspace.description}
                  </p>

                  {/* Metadata line */}
                  <div className="flex items-center gap-5 text-xs text-slate-400 flex-wrap">
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" 
                        alt="Owner" 
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-slate-300 font-medium">Priya Sharma (You) <span className="text-slate-500">Workspace Owner</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{membersList.length} Members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Created on</span>
                      <span>{activeWorkspace.createdAt || 'Aug 01, 2025'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Quick links & Actions */}
              <div className="flex flex-col items-start lg:items-end gap-4 shrink-0">
                {/* Actions row */}
                <div className="flex items-center gap-2.5">
                  <Link
                    to="/profile"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#161c2e] hover:bg-[#1e263d] text-slate-200 border border-[#242e47] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" /> Workspace Settings
                  </Link>
                  {isPM && (
                    <button
                      type="button"
                      onClick={() => setIsInviteOpen(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Invite Members
                    </button>
                  )}
                </div>

                {/* Quick Links */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 lg:text-right">
                    Quick Links
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/workspace/${activeWorkspace.id}/intelligence/insights`}
                      className="px-3 py-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1d273e] text-slate-300 hover:text-white border border-[#202940] text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-[#8b5cf6]" /> Insights
                    </Link>
                    <Link
                      to={`/workspace/${activeWorkspace.id}/data/datasets`}
                      className="px-3 py-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1d273e] text-slate-300 hover:text-white border border-[#202940] text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Feedback
                    </Link>
                    <Link
                      to={`/workspace/${activeWorkspace.id}/intelligence/issues`}
                      className="px-3 py-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1d273e] text-slate-300 hover:text-white border border-[#202940] text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" /> Features
                    </Link>
                    <Link
                      to={`/workspace/${activeWorkspace.id}/development/tasks`}
                      className="px-3 py-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1d273e] text-slate-300 hover:text-white border border-[#202940] text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Map className="w-3.5 h-3.5 text-orange-400" /> Roadmap
                    </Link>
                    <Link
                      to={`/workspace/${activeWorkspace.id}/reports`}
                      className="px-3 py-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1d273e] text-slate-300 hover:text-white border border-[#202940] text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-sky-400" /> Reports
                    </Link>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* 2. Stats Row (5 Cards matching Image 1) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* Total Feedback */}
            <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1c253b] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Feedback</span>
                <p className="text-xl font-bold text-white tracking-tight">{stats.totalFeedback}</p>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3 h-3" /> {stats.feedbackGrowth} <span className="text-slate-500 font-normal ml-1">vs last 30 days</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
            </div>

            {/* Total Features */}
            <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1c253b] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Features</span>
                <p className="text-xl font-bold text-white tracking-tight">{stats.totalFeatures}</p>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3 h-3" /> {stats.featuresGrowth} <span className="text-slate-500 font-normal ml-1">vs last 30 days</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <ListTodo className="w-5 h-5 text-blue-400" />
              </div>
            </div>

            {/* Insights Generated */}
            <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1c253b] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Insights Generated</span>
                <p className="text-xl font-bold text-white tracking-tight">{stats.insightsGenerated}</p>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3 h-3" /> {stats.insightsGrowth} <span className="text-slate-500 font-normal ml-1">vs last 30 days</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Active Members */}
            <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1c253b] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Active Members</span>
                <p className="text-xl font-bold text-white tracking-tight">{membersList.length}</p>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3 h-3" /> {stats.membersGrowth} <span className="text-slate-500 font-normal ml-1">vs last 30 days</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            {/* Data Sources */}
            <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1c253b] flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-1">Data Sources</span>
                <p className="text-xl font-bold text-white tracking-tight">{dataSources.length}</p>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3 h-3" /> {stats.dataSourcesGrowth} <span className="text-slate-500 font-normal ml-1">vs last 30 days</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
            </div>

          </div>

          {/* 3. Lower Section: 2 Columns (Recent Activity left, Members & Data Sources right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Recent Activity (~65%) */}
            <div className="lg:col-span-7 rounded-2xl bg-[#0f1422] border border-[#1c253b] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-white">Recent Activity</h3>
                <button className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold transition-colors cursor-pointer">
                  View All Activity
                </button>
              </div>

              {/* Activity Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1c253b] text-[11px] font-semibold text-slate-400">
                      <th className="pb-3 font-semibold">Activity</th>
                      <th className="pb-3 font-semibold">User</th>
                      <th className="pb-3 font-semibold">Module</th>
                      <th className="pb-3 font-semibold text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#171e30]">
                    {recentActivities.map((act) => (
                      <tr key={act.id} className="hover:bg-white/[0.02] transition-colors group">
                        
                        {/* Activity title */}
                        <td className="py-3.5 pr-3 text-slate-200 font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                              <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
                            </div>
                            <span className="truncate max-w-[220px] sm:max-w-xs">{act.activity}</span>
                          </div>
                        </td>

                        {/* User */}
                        <td className="py-3.5 pr-3 text-slate-300">
                          <div className="flex items-center gap-2">
                            {act.isAi ? (
                              <div className="w-5 h-5 rounded-full bg-[#5b3df5]/30 flex items-center justify-center text-[10px] text-[#a78bfa] font-bold shrink-0">
                                AI
                              </div>
                            ) : (
                              <img 
                                src={act.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'} 
                                alt={act.user} 
                                className="w-5 h-5 rounded-full object-cover shrink-0" 
                              />
                            )}
                            <span className="truncate max-w-[100px]">{act.user}</span>
                          </div>
                        </td>

                        {/* Module */}
                        <td className="py-3.5 pr-3">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${act.moduleColor || 'bg-purple-950/70 text-purple-300 border-purple-800/50'}`}>
                            {act.module}
                          </span>
                        </td>

                        {/* Time */}
                        <td className="py-3.5 text-slate-500 font-mono text-[11px] text-right whitespace-nowrap">
                          {act.time}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Members (12) + Data Sources (8) (~35%) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Members Card */}
              <div className="rounded-2xl bg-[#0f1422] border border-[#1c253b] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Members ({membersList.length})</h3>
                  <button className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold transition-colors cursor-pointer">
                    View All
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  {membersList.slice(0, 6).map((member) => (
                    <div 
                      key={member.email || member.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/[0.02] transition-colors relative"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`} 
                          alt={member.name}
                          className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{member.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{member.roleTitle || member.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                          member.role === 'Owner' 
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : member.role === 'Admin'
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                        }`}>
                          {member.role}
                        </span>

                        {isPM && member.role !== 'Owner' && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setSelectedMemberMenu(selectedMemberMenu === member.email ? null : member.email)}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.06] cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {selectedMemberMenu === member.email && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-[#161c2c] border border-[#232d44] rounded-xl shadow-xl p-1 z-30 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member.email)}
                                  className="w-full text-left px-2 py-1.5 rounded text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Invite Members button */}
                {isPM && (
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(true)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[#5b3df5]/40 hover:border-[#5b3df5] text-xs font-semibold text-[#8b5cf6] hover:bg-[#5b3df5]/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Invite Members
                  </button>
                )}
              </div>

              {/* Data Sources Card */}
              <div className="rounded-2xl bg-[#0f1422] border border-[#1c253b] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Data Sources ({dataSources.length})</h3>
                  <button className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold transition-colors cursor-pointer">
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {dataSources.map((ds) => (
                    <div 
                      key={ds.id}
                      className="p-2.5 rounded-xl bg-[#131826] border border-[#1c2438] flex items-center justify-between gap-2"
                    >
                      <span className="text-[11px] font-semibold text-slate-300 truncate">{ds.name}</span>
                      <span className="text-[11px] font-bold text-slate-400 font-mono shrink-0">{ds.count}</span>
                    </div>
                  ))}
                </div>

                {/* Add Data Source */}
                {isPM && (
                  <button
                    type="button"
                    onClick={() => setIsAddSourceOpen(true)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-white/15 hover:border-white/30 text-xs font-semibold text-slate-300 hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Data Source
                  </button>
                )}
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* --- MODAL 1: INVITE & ASSIGN MEMBERS MODAL --- */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e1320] border border-[#20293f] shadow-2xl p-6 sm:p-7 relative animate-fade-in-up">
            
            <button 
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#5b3df5]/20 border border-[#5b3df5]/30 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Invite & Assign Member</h3>
                <p className="text-xs text-slate-400">Add team members to {activeWorkspace.name}</p>
              </div>
            </div>

            {/* Quick Pick Pool */}
            <div className="mb-5 p-3 rounded-xl bg-[#131826] border border-[#1d263b]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Quick Select Available Candidates:
              </span>
              <div className="flex flex-wrap gap-2">
                {availableTeamPool.map((cand, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectCandidate(cand)}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-[#5b3df5]/20 border border-white/[0.08] hover:border-[#5b3df5]/50 text-xs text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {cand.name} ({cand.roleTitle})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAssignMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Member Name
                </label>
                <input 
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141a2a] border border-[#20293f] text-sm text-white focus:outline-none focus:border-[#5b3df5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. rahul@demo.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141a2a] border border-[#20293f] text-sm text-white focus:outline-none focus:border-[#5b3df5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Access Level
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#141a2a] border border-[#20293f] text-sm text-white focus:outline-none focus:border-[#5b3df5]"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={inviteRoleTitle}
                    onChange={(e) => setInviteRoleTitle(e.target.value)}
                    placeholder="e.g. UX Designer / QA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141a2a] border border-[#20293f] text-sm text-white focus:outline-none focus:border-[#5b3df5]"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Assign Member
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* --- MODAL 2: CREATE WORKSPACE MODAL --- */}
      {isNewWsOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0e1320] border border-[#20293f] shadow-2xl p-6 sm:p-7 relative animate-fade-in-up">
            
            <button 
              type="button"
              onClick={() => setIsNewWsOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Create New Workspace</h3>
            <p className="text-xs text-slate-400 mb-5">Set up a product intelligence workspace node.</p>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Workspace Name
                </label>
                <input 
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. HealthTech Mobile App"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141a2a] border border-[#20293f] text-sm text-white focus:outline-none focus:border-[#5b3df5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea 
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Core workspace for analyzing user telemetry and feedback."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141a2a] border border-[#20293f] text-sm text-white focus:outline-none focus:border-[#5b3df5]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewWsOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all"
                >
                  Deploy Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD DATA SOURCE MODAL --- */}
      {isAddSourceOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0e1320] border border-[#20293f] shadow-2xl p-6 relative animate-fade-in-up">
            
            <button 
              type="button"
              onClick={() => setIsAddSourceOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Add Data Source</h3>
            <p className="text-xs text-slate-400 mb-4">Connect a feedback channel to this workspace.</p>

            <form onSubmit={handleAddDataSource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Source Name
                </label>
                <input 
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="e.g. Intercom Chats, Discord Community"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141a2a] border border-[#20293f] text-sm text-white focus:outline-none focus:border-[#5b3df5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Ingested Count
                </label>
                <input 
                  type="text"
                  value={newSourceCount}
                  onChange={(e) => setNewSourceCount(e.target.value)}
                  placeholder="e.g. 450"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141a2a] border border-[#20293f] text-sm text-white focus:outline-none focus:border-[#5b3df5]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddSourceOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg"
                >
                  Connect Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}