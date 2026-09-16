import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Settings,
  Users,
  Database,
  Trash2,
  Save,
  UserPlus,
  Shield,
  Clock,
  Globe,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Check,
  Loader2,
  ChevronDown,
  LayoutGrid,
  FileText,
  UploadCloud,
  X,
  RefreshCw,
} from 'lucide-react';
import { workspaceApi, datasetApi } from '../../api/client';
import { getCurrentUser, isProductManager, getActiveWorkspaceId, setActiveWorkspaceId } from '../../utils/workspaceAccess';

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

  // Member invite states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
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

  // Add / Invite member
  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !activeWsId) return;

    setIsInviting(true);
    setInviteError('');
    setInviteSuccess(false);

    try {
      await workspaceApi.addMember(activeWsId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setInviteSuccess(true);
      setInviteEmail('');
      setTimeout(() => {
        setInviteSuccess(false);
        setIsInviteOpen(false);
      }, 1500);

      // Refresh member list
      const freshMembers = await workspaceApi.listMembers(activeWsId);
      if (Array.isArray(freshMembers)) setMembers(freshMembers);
    } catch (err) {
      setInviteError(err.message || 'Failed to add member.');
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5b3df5] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#5b3df5]/30 shrink-0">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Workspace Settings</h1>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#5b3df5]/20 text-[#a78bfa] border border-[#5b3df5]/30">
                {workspace?.name || 'Active Workspace'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Configure workspace metadata, team permissions, integrations, and data sources</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <select
            value={activeWsId}
            onChange={(e) => handleSwitchWorkspace(e.target.value)}
            className="bg-[#070a12] border border-[#1e2942] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#5b3df5] transition-colors"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.members_count ?? 1} Members)
              </option>
            ))}
          </select>

          <Link
            to={`/workspace/${activeWsId}/overview`}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#111728] hover:bg-[#18223c] text-slate-300 border border-[#1f2a48] transition-colors"
          >
            Go to PM Dashboard
          </Link>
        </div>
      </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-[#151b2a] pb-3">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#5b3df5] text-white shadow-lg shadow-[#5b3df5]/30'
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
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-200">
                <X size={14} />
              </button>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check size={16} />
              <span>Workspace settings successfully saved and synced with the backend!</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#5b3df5]" />
              <p className="text-xs font-medium">Loading workspace settings...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: GENERAL SETTINGS */}
              {activeTab === 'general' && (
                <form onSubmit={handleSaveGeneral} className="space-y-6">
                  <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-6 space-y-5">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#a78bfa]" />
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
                          className="w-full bg-[#070a12] border border-[#1a233a] focus:border-[#5b3df5] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                          placeholder="e.g. Acme Corp Intelligence"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Target Product Name</label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          className="w-full bg-[#070a12] border border-[#1a233a] focus:border-[#5b3df5] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
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
                        className="w-full bg-[#070a12] border border-[#1a233a] focus:border-[#5b3df5] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                        placeholder="Provide details about the product, customer segments, and strategic objectives..."
                      />
                    </div>
                  </div>

                  {/* Localization & Industry Config */}
                  <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-6 space-y-5">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#a78bfa]" />
                      Localization & Classification
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Industry / Domain</label>
                        <select
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="w-full bg-[#070a12] border border-[#1a233a] focus:border-[#5b3df5] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                        >
                          {INDUSTRIES.map((ind) => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Timezone</label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full bg-[#070a12] border border-[#1a233a] focus:border-[#5b3df5] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Currency</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full bg-[#070a12] border border-[#1a233a] focus:border-[#5b3df5] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                        >
                          {CURRENCIES.map((curr) => (
                            <option key={curr.code} value={curr.code}>{curr.label}</option>
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
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5b3df5] to-[#7c3aed] text-white hover:shadow-lg hover:shadow-[#5b3df5]/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
                  <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#a78bfa]" />
                          Workspace Team Members
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Manage collaborator permissions and role-based access for this workspace
                        </p>
                      </div>

                      <button
                        onClick={() => setIsInviteOpen(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5b3df5] hover:bg-[#6d4df7] text-white shadow-md shadow-[#5b3df5]/30 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <UserPlus size={14} />
                        <span>Add Member</span>
                      </button>
                    </div>

                    {/* Member List Table */}
                    <div className="divide-y divide-[#151b2a] border border-[#161f33] rounded-xl overflow-hidden bg-[#070a12]">
                      {members.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                          No team members found for this workspace.
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
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5b3df5]/30 to-[#8b5cf6]/30 border border-[#5b3df5]/40 flex items-center justify-center text-xs font-bold text-white shrink-0">
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
                                {/* Role Selector */}
                                <select
                                  value={member.role || 'member'}
                                  onChange={(e) => handleRoleChange(member.user_id || member.id, e.target.value)}
                                  className="bg-[#0e1322] border border-[#1e2942] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#5b3df5]"
                                >
                                  <option value="product_manager">Product Manager (PM)</option>
                                  <option value="member">Team Member</option>
                                  <option value="viewer">Viewer</option>
                                </select>

                                {/* Remove Member Action */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member.user_id || member.id, member.email || member.user_email)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Remove Member"
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

                  {/* Invite Member Popup Modal */}
                  {isInviteOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                      <div className="bg-[#0d121f] border border-[#1e2942] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-[#1a233a]">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-[#a78bfa]" />
                            Invite Member to Workspace
                          </h3>
                          <button
                            onClick={() => setIsInviteOpen(false)}
                            className="text-slate-400 hover:text-white p-1"
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
                            <span>Member added successfully!</span>
                          </div>
                        )}

                        <form onSubmit={handleInviteMember} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">User Email Address</label>
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              required
                              placeholder="colleague@company.com"
                              className="w-full bg-[#070a12] border border-[#1a233a] focus:border-[#5b3df5] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">Assign Role</label>
                            <select
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value)}
                              className="w-full bg-[#070a12] border border-[#1a233a] focus:border-[#5b3df5] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                            >
                              <option value="product_manager">Product Manager (Full Access)</option>
                              <option value="member">Team Member (Editor)</option>
                              <option value="viewer">Viewer (Read-Only)</option>
                            </select>
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsInviteOpen(false)}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/[0.05]"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isInviting}
                              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#5b3df5] text-white hover:bg-[#6d4df7] flex items-center gap-2 disabled:opacity-50"
                            >
                              {isInviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              <span>Send Invite</span>
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
                    <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-5 space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400">Total Datasets</span>
                      <p className="text-2xl font-bold text-white">{datasets.length}</p>
                      <span className="text-[10px] text-emerald-400 font-medium">Active in intelligence pipeline</span>
                    </div>

                    <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-5 space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400">Estimated Feedback Records</span>
                      <p className="text-2xl font-bold text-white">
                        {datasets.reduce((acc, d) => acc + (d.record_count || d.total_rows || 0), 0).toLocaleString()}
                      </p>
                      <span className="text-[10px] text-[#a78bfa] font-medium">Indexed for theme clustering</span>
                    </div>

                    <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-5 space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400">Storage Allocated</span>
                      <p className="text-2xl font-bold text-white">
                        {(datasets.length * 2.4).toFixed(1)} MB / 10 GB
                      </p>
                      <div className="w-full h-1.5 bg-[#161f33] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-[#5b3df5] w-[5%] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Connected datasets list */}
                  <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          <Database className="w-4 h-4 text-[#a78bfa]" />
                          Workspace Datasets
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Files and feedback streams connected to this workspace
                        </p>
                      </div>

                      <Link
                        to={`/workspace/${activeWsId}/data/upload`}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5b3df5] hover:bg-[#6d4df7] text-white shadow-md shadow-[#5b3df5]/30 transition-all flex items-center gap-2"
                      >
                        <UploadCloud size={14} />
                        <span>Upload Dataset</span>
                      </Link>
                    </div>

                    <div className="divide-y divide-[#151b2a] border border-[#161f33] rounded-xl overflow-hidden bg-[#070a12]">
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
                <div className="bg-[#0b0f19] border border-rose-500/20 rounded-2xl p-6 space-y-6">
                  <div>
                    <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Danger Zone
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Destructive actions that directly affect this workspace and associated data
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-[#070a12] border border-rose-500/20 flex items-center justify-between">
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
                      <div className="bg-[#0d121f] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
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
                          className="w-full bg-[#070a12] border border-[#1a233a] focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
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

