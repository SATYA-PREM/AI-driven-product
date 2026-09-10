import { mockWorkspaces, defaultMembers } from '../mock/workspaces';

const PRODUCT_MANAGER_EMAIL = 'pm@demo.com';

export function getStoredWorkspaces() {
  try {
    const raw = localStorage.getItem('mock_workspaces');
    if (!raw) {
      localStorage.setItem('mock_workspaces', JSON.stringify(mockWorkspaces));
      return mockWorkspaces;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('mock_workspaces', JSON.stringify(mockWorkspaces));
      return mockWorkspaces;
    }
    return parsed;
  } catch {
    localStorage.setItem('mock_workspaces', JSON.stringify(mockWorkspaces));
    return mockWorkspaces;
  }
}

export function saveStoredWorkspaces(workspaces) {
  localStorage.setItem('mock_workspaces', JSON.stringify(workspaces));
}

export function getCurrentUser() {
  const email = localStorage.getItem('demo_email') || 'pm@demo.com';
  const role = localStorage.getItem('demo_role') || (email === PRODUCT_MANAGER_EMAIL ? 'PRODUCT_MANAGER' : 'USER');
  const name = localStorage.getItem('demo_name') || (email === PRODUCT_MANAGER_EMAIL ? 'Priya Sharma' : 'Team Member');
  const roleTitle = localStorage.getItem('demo_role_title') || (email === PRODUCT_MANAGER_EMAIL ? 'Product Manager' : 'Team Member');
  const avatar = localStorage.getItem('demo_avatar') || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';

  return {
    email,
    role,
    name,
    roleTitle,
    avatar
  };
}

export function setCurrentUser({ email, role, name, roleTitle, avatar }) {
  localStorage.setItem('token', `demo-token-${email}`);
  localStorage.setItem('demo_email', email);
  localStorage.setItem('demo_role', role);
  if (name) localStorage.setItem('demo_name', name);
  if (roleTitle) localStorage.setItem('demo_role_title', roleTitle);
  if (avatar) localStorage.setItem('demo_avatar', avatar);
}

export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('demo_email');
  localStorage.removeItem('demo_role');
  localStorage.removeItem('demo_name');
  localStorage.removeItem('demo_role_title');
  localStorage.removeItem('demo_avatar');
}

export function isProductManager() {
  const user = getCurrentUser();
  return user.role === 'PRODUCT_MANAGER' || user.email === PRODUCT_MANAGER_EMAIL;
}

export function canAccessWorkspace(workspace, userOverride = null) {
  if (!workspace) return false;
  const user = userOverride || getCurrentUser();

  // Product Manager has global access to all workspaces
  if (user.role === 'PRODUCT_MANAGER' || user.email === PRODUCT_MANAGER_EMAIL) {
    return true;
  }

  // Workspace owner has access
  if (workspace.ownerEmail && workspace.ownerEmail.toLowerCase() === user.email.toLowerCase()) {
    return true;
  }

  // Check if user is in workspace.members
  if (Array.isArray(workspace.members)) {
    return workspace.members.some((m) => {
      if (typeof m === 'string') return m.toLowerCase() === user.email.toLowerCase();
      return m.email && m.email.toLowerCase() === user.email.toLowerCase();
    });
  }

  return false;
}

export function getWorkspaceById(workspaceId) {
  const workspaces = getStoredWorkspaces();
  return workspaces.find((ws) => ws.id === workspaceId) || workspaces[0];
}

export function assignMemberToWorkspace(workspaceId, memberData) {
  const workspaces = getStoredWorkspaces();
  const index = workspaces.findIndex((ws) => ws.id === workspaceId);
  if (index === -1) return null;

  const workspace = { ...workspaces[index] };
  const currentMembers = [...(workspace.members || [])];

  const existingIdx = currentMembers.findIndex((m) => 
    (typeof m === 'object' ? m.email?.toLowerCase() : m?.toLowerCase()) === memberData.email?.toLowerCase()
  );

  const newMemberObj = {
    id: memberData.id || `m_${Date.now()}`,
    name: memberData.name || memberData.email.split('@')[0],
    email: memberData.email,
    role: memberData.role || 'Member',
    roleTitle: memberData.roleTitle || memberData.role || 'Team Member',
    avatar: memberData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(memberData.email)}`,
    initials: (memberData.name || memberData.email).slice(0, 2).toUpperCase(),
  };

  if (existingIdx !== -1) {
    currentMembers[existingIdx] = { ...currentMembers[existingIdx], ...newMemberObj };
  } else {
    currentMembers.push(newMemberObj);
  }

  workspace.members = currentMembers;
  workspace.membersCount = currentMembers.length;
  if (workspace.stats) {
    workspace.stats.activeMembers = String(currentMembers.length);
  }

  // Add an entry in recent activity
  const newActivity = {
    id: `act_${Date.now()}`,
    activity: `Assigned ${newMemberObj.name} (${newMemberObj.roleTitle})`,
    user: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    module: 'Members',
    moduleColor: 'bg-purple-950/70 text-purple-300 border-purple-800/50',
    time: 'Just now',
    icon: 'Users'
  };

  workspace.recentActivity = [newActivity, ...(workspace.recentActivity || [])].slice(0, 15);

  workspaces[index] = workspace;
  saveStoredWorkspaces(workspaces);
  return workspace;
}

export function removeMemberFromWorkspace(workspaceId, memberEmail) {
  const workspaces = getStoredWorkspaces();
  const index = workspaces.findIndex((ws) => ws.id === workspaceId);
  if (index === -1) return null;

  const workspace = { ...workspaces[index] };
  workspace.members = (workspace.members || []).filter((m) => {
    const email = typeof m === 'object' ? m.email : m;
    return email?.toLowerCase() !== memberEmail?.toLowerCase();
  });
  workspace.membersCount = workspace.members.length;
  if (workspace.stats) {
    workspace.stats.activeMembers = String(workspace.members.length);
  }

  workspaces[index] = workspace;
  saveStoredWorkspaces(workspaces);
  return workspace;
}

export function addDataSourceToWorkspace(workspaceId, newDataSource) {
  const workspaces = getStoredWorkspaces();
  const index = workspaces.findIndex((ws) => ws.id === workspaceId);
  if (index === -1) return null;

  const workspace = { ...workspaces[index] };
  const currentSources = [...(workspace.dataSources || [])];
  
  currentSources.push({
    id: `ds_${Date.now()}`,
    name: newDataSource.name,
    count: newDataSource.count || '0',
    icon: newDataSource.icon || 'Database',
    color: 'text-indigo-400 bg-indigo-500/10'
  });

  workspace.dataSources = currentSources;
  if (workspace.stats) {
    workspace.stats.dataSources = String(currentSources.length);
  }

  workspaces[index] = workspace;
  saveStoredWorkspaces(workspaces);
  return workspace;
}

export function getWorkspaceOwnerDefaults() {
  const user = getCurrentUser();
  return {
    ownerEmail: user.email || PRODUCT_MANAGER_EMAIL,
    ownerName: user.name || 'Priya Sharma',
    members: defaultMembers,
    membersCount: defaultMembers.length
  };
}

