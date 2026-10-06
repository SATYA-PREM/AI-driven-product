import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Settings,
  Users,
  Database,
  Trash2,
  Save,
  UserPlus,
  Globe,
  AlertTriangle,
  Check,
  Loader2,
  FileText,
  UploadCloud,
  X,
} from 'lucide-react';
import { workspaceApi } from '../../api/workspaces';
import { datasetApi } from '../../api/datasets';
import { userApi } from '../../api/auth';
import { getCurrentUser, isProductManager, setActiveWorkspaceId } from '../../utils/workspaceAccess';

const INDUSTRIES = [
  'FinTech',
  'SaaS / Cloud',
  'Healthcare & Life Sciences',
  'E-Commerce & Retail',
  'DevTools & Infrastructure',
  'EdTech',
  'AI / Machine Learning',
  'Logistics & Supply Chain',
  'Media & Entertainment',
  'Other',
];

const TIMEZONES = [
  'UTC',
  'America/New_York (EST)',
  'America/Chicago (CST)',
  'America/Denver (MST)',
  'America/Los_Angeles (PST)',
  'Europe/London (GMT)',
  'Europe/Paris (CET)',
  'Asia/Kolkata (IST)',
  'Asia/Singapore (SGT)',
  'Asia/Tokyo (JST)',
  'Australia/Sydney (AEST)',
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'CAD', symbol: '$', label: 'CAD ($)' },
  { code: 'AUD', symbol: '$', label: 'AUD ($)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
];

export default function WorkspaceSettings() {
  const { workspaceId: paramWsId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isPM = isProductManager();

  const [activeTab, setActiveTab] = useState('general');
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWsId, setActiveWsId] = useState(paramWsId || '');
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [datasets, setDatasets] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states for general settings
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [industry, setIndustry] = useState('SaaS / Cloud');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('USD');

  // Platform users pool
  const [allPlatformUsers, setAllPlatformUsers] = useState([]);

  // Option 1: Add New Member (System-level user creation without workspace access)
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Welcome@123');
  const [newUserRole, setNewUserRole] = useState('member');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState(false);

  // Option 2: Add Member to Workspace (Grants active workspace permissions)
  const [isAddWorkspaceMemberOpen, setIsAddWorkspaceMemberOpen] = useState(false);
  const [memberInputMode, setMemberInputMode] = useState('existing'); // 'existing' | 'manual'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('Welcome@123');
  const [inviteRole, setInviteRole] = useState('product_manager');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all initial workspace data
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const wsList = await workspaceApi.listWorkspaces();
        if (!isMounted) return;

        const list = Array.isArray(wsList) ? wsList : [];
        setWorkspaces(list);

        let targetId = activeWsId;
        if (!targetId || !list.some((w) => w.id === targetId)) {
          targetId = list.length > 0 ? list[0].id : '';
          setActiveWsId(targetId);
        }

        if (targetId) {
          await loadWorkspaceDetails(targetId);
        }
      } catch (err) {
        if (isMounted) setErrorMessage(err.message || 'Failed to load workspace settings.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initialize();
    return () => { isMounted = false; };
  }, [paramWsId]);

  // Load specific workspace details, members, and datasets
  const loadWorkspaceDetails = async (wsId) => {
    if (!wsId) return;
    try {
      const [wsData, membersData, datasetsData] = await Promise.allSettled([
        workspaceApi.getWorkspace(wsId),
        workspaceApi.listMembers(wsId),
        datasetApi.list(wsId),
      ]);

      if (wsData.status === 'fulfilled' && wsData.value) {
        const ws = wsData.value;
        setWorkspace(ws);
        setName(ws.name || '');
        setDescription(ws.description || '');
        const settings = ws.settings || {};
        setProductName(settings.product_name || ws.name || '');
        setIndustry(settings.industry || 'SaaS / Cloud');
        setTimezone(settings.timezone || 'UTC');
        setCurrency(settings.currency || 'USD');
      }

      if (membersData.status === 'fulfilled' && Array.isArray(membersData.value)) {
        setMembers(membersData.value);
      } else {
        setMembers([]);
      }

      if (datasetsData.status === 'fulfilled' && Array.isArray(datasetsData.value)) {
        setDatasets(datasetsData.value);
      } else {
        setDatasets([]);
      }
    } catch (err) {
      console.warn('Notice loading workspace details:', err.message);
    }
  };

  // Switch workspace
  const handleSwitchWorkspace = (newId) => {
    setActiveWorkspaceId(newId);
    setActiveWsId(newId);
    navigate(`/workspace/${newId}/settings`);
    loadWorkspaceDetails(newId);
  };

  // Save general settings
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    if (!activeWsId) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const payload = {
        name,
        description,
        product_name: productName,
        industry,
        timezone,
        currency,
        settings: {
          product_name: productName,
          industry,
          timezone,
          currency,
        },
      };

      const updated = await workspaceApi.updateWorkspace(activeWsId, payload);
      setWorkspace(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh workspace list in state
      const wsList = await workspaceApi.listWorkspaces();
      if (Array.isArray(wsList)) setWorkspaces(wsList);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Load platform users for picker
  const loadPlatformUsers = async () => {
    try {
      const users = await userApi.listUsers();
      if (Array.isArray(users)) {
        setAllPlatformUsers(users);
        if (users.length > 0 && !selectedUserId) {
          setSelectedUserId(users[0].id);
        }
      }
    } catch (err) {
      console.warn('Could not load platform users:', err.message);
    }
  };

  // Option 1: Create a new system user (No workspace access yet)
  const handleCreateNewUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    setIsCreatingUser(true);
    setCreateUserError('');
    setCreateUserSuccess(false);

    try {
      await userApi.createUser({
        name: newUserName.trim() || newUserEmail.split('@')[0],
        email: newUserEmail.trim().toLowerCase(),
        password: newUserPassword.trim() || 'Welcome@123',
        role: newUserRole,
      });

      setCreateUserSuccess(true);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('Welcome@123');
      await loadPlatformUsers();

      setTimeout(() => {
        setCreateUserSuccess(false);
        setIsCreateUserOpen(false);
      }, 1400);
    } catch (err) {
      setCreateUserError(err.message || 'Failed to create platform member.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Option 2: Add member to workspace (Grants workspace access)
  const handleAddMemberToWorkspace = async (e) => {
    e.preventDefault();
    if (!activeWsId) return;

    let targetEmail = inviteEmail.trim().toLowerCase();
    let targetName = inviteName.trim();

    if (memberInputMode === 'existing') {
      const found = allPlatformUsers.find((u) => u.id === selectedUserId);
      if (found) {
        targetEmail = found.email.toLowerCase();
        targetName = found.name;
      }
    }

    if (!targetEmail) {
      setInviteError('Please select or provide a member email.');
      return;
    }

    setIsInviting(true);
    setInviteError('');
    setInviteSuccess(false);

    try {
      await workspaceApi.addMember(activeWsId, {
        email: targetEmail,
        role: inviteRole,
        name: targetName,
        password: invitePassword.trim() || 'Welcome@123',
      });

      setInviteSuccess(true);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('Welcome@123');

      // Refresh workspace members
      const freshMembers = await workspaceApi.listMembers(activeWsId);
      if (Array.isArray(freshMembers)) setMembers(freshMembers);

      setTimeout(() => {
        setInviteSuccess(false);
        setIsAddWorkspaceMemberOpen(false);
      }, 1200);
    } catch (err) {
      setInviteError(err.message || 'Failed to add member to workspace.');
    } finally {
      setIsInviting(false);
    }
  };

  // Update member role
  const handleRoleChange = async (userId, newRole) => {
    if (!activeWsId || !userId) return;
    try {
      await workspaceApi.updateMember(activeWsId, userId, { role: newRole });
      const freshMembers = await workspaceApi.listMembers(activeWsId);
      if (Array.isArray(freshMembers)) setMembers(freshMembers);
    } catch (err) {
      alert(err.message || 'Failed to update member role.');
    }
  };

  // Remove member
  const handleRemoveMember = async (userId, memberEmail) => {
    if (!activeWsId || !userId) return;
    if (!window.confirm(`Are you sure you want to remove ${memberEmail || 'this member'} from the workspace?`)) {
      return;
    }

    try {
      await workspaceApi.removeMember(activeWsId, userId);
      const freshMembers = await workspaceApi.listMembers(activeWsId);
      if (Array.isArray(freshMembers)) setMembers(freshMembers);
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  // Delete dataset
  const handleDeleteDataset = async (datasetId) => {
    if (!window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }
    try {
      await datasetApi.deleteDataset(datasetId);
      const freshDatasets = await datasetApi.list(activeWsId);
      if (Array.isArray(freshDatasets)) setDatasets(freshDatasets);
    } catch (err) {
      alert(err.message || 'Failed to delete dataset.');
    }
  };

  // Delete Workspace
  const handleDeleteWorkspace = async () => {
    if (!activeWsId) return;
    if (confirmName !== workspace?.name) {
      alert('Workspace name does not match confirmation.');
      return;
    }

    setIsDeleting(true);
    try {
      await workspaceApi.deleteWorkspace(activeWsId);
      setIsDeleteModalOpen(false);
      navigate('/workspaces');
    } catch (err) {
      alert(err.message || 'Failed to delete workspace.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 text-slate-100 font-sans">
      {/* Top Header Card */}
      <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/20 shrink-0">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Workspace Settings</h1>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {workspace?.name || 'Active Workspace'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Configure workspace metadata, team permissions, and data sources</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <select
            value={activeWsId}
            onChange={(e) => handleSwitchWorkspace(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-500/40 transition-colors"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id} className="bg-[#090d1c]">
                {ws.name} ({ws.members_count ?? 1} Members)
              </option>
            ))}
          </select>

          <Link
            to={`/workspace/${activeWsId}/overview`}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-colors"
          >
            Go to PM Dashboard
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        {[
          { id: 'general', label: 'General Settings', icon: Settings },
          { id: 'members', label: `Team & Members (${members.length})`, icon: Users },
          { id: 'data', label: `Data & Storage (${datasets.length})`, icon: Database },
          { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback message banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between backdrop-blur-xl">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-200">
            <X size={14} />
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 backdrop-blur-xl">
          <Check size={16} />
          <span>Workspace settings saved successfully!</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-xs font-medium">Loading workspace settings...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 space-y-5 shadow-lg">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  Workspace Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Workspace Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                      placeholder="e.g. Acme Corp Intelligence"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Target Product Name</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                      placeholder="e.g. Acme Web App"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                    placeholder="Provide details about the product and objectives..."
                  />
                </div>
              </div>

              {/* Localization & Industry Config */}
              <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 space-y-5 shadow-lg">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  Localization & Classification
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Industry / Domain</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind} className="bg-[#090d1c]">{ind}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz} className="bg-[#090d1c]">{tz}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code} className="bg-[#090d1c]">{curr.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Save Button Bar */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TEAM & MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 space-y-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      Workspace Team Members
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Manage collaborator permissions and role-based access for this workspace
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateUserOpen(true);
                        setCreateUserError('');
                        setCreateUserSuccess(false);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] hover:border-white/[0.16] transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus size={14} className="text-purple-400" />
                      <span>Add New Member</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddWorkspaceMemberOpen(true);
                        setInviteError('');
                        setInviteSuccess(false);
                        loadPlatformUsers();
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Users size={14} />
                      <span>Add Member to Workspace</span>
                    </button>
                  </div>
                </div>

                {/* Member List Table */}
                <div className="divide-y divide-white/[0.06] border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.02]">
                  {members.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No team members found for this workspace. Use "Add Member to Workspace" to grant access to collaborators.
                    </div>
                  ) : (
                    members.map((member) => {
                      const isCurrentUserPM = member.role === 'product_manager' || member.role === 'pm' || member.role === 'owner';
                      return (
                        <div
                          key={member.id || member.user_id}
                          className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {(member.name || member.user_name || member.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-white truncate">
                                  {member.name || member.user_name || 'Team Collaborator'}
                                </p>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    isCurrentUserPM
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  }`}
                                >
                                  {member.role || 'Member'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {member.email || member.user_email || 'user@example.com'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <select
                              value={member.role || 'member'}
                              onChange={(e) => handleRoleChange(member.user_id || member.id, e.target.value)}
                              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/40 cursor-pointer"
                            >
                              <option value="product_manager" className="bg-[#090d1c]">Product Manager (PM)</option>
                              <option value="product_designer" className="bg-[#090d1c]">Product Designer</option>
                              <option value="developer" className="bg-[#090d1c]">Developer</option>
                              <option value="qa" className="bg-[#090d1c]">QA / Tester</option>
                              <option value="stakeholder" className="bg-[#090d1c]">Stakeholder</option>
                              <option value="member" className="bg-[#090d1c]">Team Member</option>
                              <option value="viewer" className="bg-[#090d1c]">Viewer</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.user_id || member.id, member.email || member.user_email)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Remove Member from Workspace"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* MODAL 1: ADD NEW MEMBER */}
              {isCreateUserOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                  <div className="bg-[#090d1c]/95 border border-white/[0.12] backdrop-blur-2xl rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-purple-400" />
                          Register Platform User
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Creates a user account in the system pool. Access can then be granted per workspace.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsCreateUserOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {createUserError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        {createUserError}
                      </div>
                    )}

                    {createUserSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <Check size={14} />
                        <span>Platform user created successfully!</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateNewUser} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Full Name / Username</label>
                        <input
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          required
                          placeholder="e.g. Alex Rivera"
                          className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Email Address</label>
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          required
                          placeholder="member@company.com"
                          className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Initial Password</label>
                        <input
                          type="text"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          required
                          placeholder="Initial account password"
                          className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">System Role</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                        >
                          <option value="pm" className="bg-[#090d1c]">Product Manager (PM Role)</option>
                          <option value="member" className="bg-[#090d1c]">General Member</option>
                          <option value="admin" className="bg-[#090d1c]">Platform Admin</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setIsCreateUserOpen(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/[0.05] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isCreatingUser}
                          className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isCreatingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Create Member</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 2: ADD MEMBER TO WORKSPACE */}
              {isAddWorkspaceMemberOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                  <div className="bg-[#090d1c]/95 border border-white/[0.12] backdrop-blur-2xl rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          Add Member to Workspace
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Grant access and assign a role for <span className="text-purple-300 font-semibold">"{workspace?.name}"</span>.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsAddWorkspaceMemberOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {inviteError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        {inviteError}
                      </div>
                    )}

                    {inviteSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <Check size={14} />
                        <span>Member added to workspace!</span>
                      </div>
                    )}

                    {/* Mode Toggle */}
                    <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => setMemberInputMode('existing')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          memberInputMode === 'existing'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Select Registered Member ({allPlatformUsers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberInputMode('manual')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          memberInputMode === 'manual'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Enter Email Directly
                      </button>
                    </div>

                    <form onSubmit={handleAddMemberToWorkspace} className="space-y-4">
                      {memberInputMode === 'existing' ? (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-300">Choose Registered Platform User</label>
                          {allPlatformUsers.length === 0 ? (
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 text-center">
                              No platform users registered yet. Switch to "Enter Email Directly" or use "Add New Member" first.
                            </div>
                          ) : (
                            <select
                              value={selectedUserId}
                              onChange={(e) => setSelectedUserId(e.target.value)}
                              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                            >
                              {allPlatformUsers.map((u) => (
                                <option key={u.id} value={u.id} className="bg-[#090d1c]">
                                  {u.name} ({u.email}) — [{u.role?.toUpperCase() || 'MEMBER'}]
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">Full Name / Username</label>
                            <input
                              type="text"
                              value={inviteName}
                              onChange={(e) => setInviteName(e.target.value)}
                              placeholder="e.g. Priya Sharma"
                              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">Email Address</label>
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              required
                              placeholder="colleague@company.com"
                              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">Password (if creating account)</label>
                            <input
                              type="text"
                              value={invitePassword}
                              onChange={(e) => setInvitePassword(e.target.value)}
                              placeholder="Initial account password"
                              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Role & Permissions in this Workspace</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                        >
                          <option value="product_manager" className="bg-[#090d1c]">Product Manager (PM - Full Access & PRD Authority)</option>
                          <option value="product_designer" className="bg-[#090d1c]">Product Designer / UX Designer</option>
                          <option value="developer" className="bg-[#090d1c]">Developer / Lead Engineer</option>
                          <option value="qa" className="bg-[#090d1c]">QA / Tester</option>
                          <option value="stakeholder" className="bg-[#090d1c]">Stakeholder / Business Owner</option>
                          <option value="member" className="bg-[#090d1c]">General Workspace Member</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setIsAddWorkspaceMemberOpen(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/[0.05] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isInviting}
                          className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isInviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Add to Workspace</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DATA & STORAGE */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Storage summary card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 space-y-2 shadow-lg">
                  <span className="text-[11px] font-semibold text-slate-400">Total Datasets</span>
                  <p className="text-2xl font-bold text-white">{datasets.length}</p>
                  <span className="text-[10px] text-emerald-400 font-medium">Active in intelligence pipeline</span>
                </div>

                <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 space-y-2 shadow-lg">
                  <span className="text-[11px] font-semibold text-slate-400">Estimated Feedback Records</span>
                  <p className="text-2xl font-bold text-white">
                    {datasets.reduce((acc, d) => acc + (d.record_count || d.total_rows || 0), 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-purple-400 font-medium">Indexed for theme clustering</span>
                </div>

                <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 space-y-2 shadow-lg">
                  <span className="text-[11px] font-semibold text-slate-400">Storage Allocated</span>
                  <p className="text-2xl font-bold text-white">
                    {(datasets.length * 2.4).toFixed(1)} MB / 10 GB
                  </p>
                  <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-purple-500 w-[5%] rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Connected datasets list */}
              <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 space-y-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-400" />
                      Workspace Datasets
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Files and feedback streams connected to this workspace
                    </p>
                  </div>

                  <Link
                    to={`/workspace/${activeWsId}/data/upload`}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 transition-all flex items-center gap-2"
                  >
                    <UploadCloud size={14} />
                    <span>Upload Dataset</span>
                  </Link>
                </div>

                <div className="divide-y divide-white/[0.06] border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.02]">
                  {datasets.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No datasets uploaded to this workspace yet.
                    </div>
                  ) : (
                    datasets.map((dataset) => (
                      <div
                        key={dataset.id}
                        className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-white truncate">{dataset.filename || dataset.name}</p>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                                {dataset.status || 'Active'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {dataset.record_count || dataset.total_rows || 0} Records • {dataset.source_type || 'feedback'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleDeleteDataset(dataset.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Dataset"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="bg-[#090d1c]/80 border border-rose-500/30 backdrop-blur-xl rounded-2xl p-6 space-y-6 shadow-lg">
              <div>
                <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Danger Zone
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Destructive actions that directly affect this workspace and associated data
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.02] border border-rose-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Delete this Workspace</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
                    Once deleted, this workspace and all associated feedback datasets, intelligence reports, and member access will be removed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                >
                  Delete Workspace
                </button>
              </div>

              {/* Safety Delete Confirmation Modal */}
              {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <div className="bg-[#090d1c]/95 border border-rose-500/30 backdrop-blur-2xl rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Confirm Workspace Deletion</h3>
                        <p className="text-xs text-slate-400">This action is irreversible.</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">
                      To confirm, please type the workspace name <span className="font-bold text-rose-400">"{workspace?.name}"</span> below:
                    </p>

                    <input
                      type="text"
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder="Type workspace name here"
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/[0.05]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={confirmName !== workspace?.name || isDeleting}
                        onClick={handleDeleteWorkspace}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 flex items-center gap-2"
                      >
                        {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Delete Forever</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
