const PRODUCT_MANAGER_EMAILS = ['user@example.com', 'pm@demo.com'];

export function getCurrentUser() {
  try {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        const role = parsed.role || 'member';
        const isPm = ['pm', 'product_manager', 'product manager', 'admin', 'owner'].includes(String(role).toLowerCase()) || PRODUCT_MANAGER_EMAILS.includes(parsed.email?.toLowerCase());
        return {
          id: parsed.id || parsed._id || 'user_default',
          email: parsed.email || 'user@example.com',
          name: parsed.name || (isPm ? 'Priya Sharma (PM)' : 'Team Member'),
          role: role,
          roleTitle: isPm ? 'Product Manager' : 'Team Member',
          avatar: parsed.avatar || (isPm 
            ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
          is_active: parsed.is_active ?? true,
        };
      }
    }
  } catch {
    // fallback
  }

  const email = localStorage.getItem('demo_email') || 'user@example.com';
  const rawRole = localStorage.getItem('demo_role') || (PRODUCT_MANAGER_EMAILS.includes(email.toLowerCase()) ? 'product_manager' : 'member');
  const isPm = ['pm', 'product_manager', 'product manager', 'admin', 'owner'].includes(String(rawRole).toLowerCase()) || PRODUCT_MANAGER_EMAILS.includes(email.toLowerCase());
  const name = localStorage.getItem('demo_name') || (isPm ? 'Priya Sharma (PM)' : 'Team Member');
  const roleTitle = localStorage.getItem('demo_role_title') || (isPm ? 'Product Manager' : 'Team Member');
  const avatar = localStorage.getItem('demo_avatar') || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';

  return {
    id: 'user_default',
    email,
    role: rawRole,
    name,
    roleTitle,
    avatar,
    is_active: true,
  };
}

export function setCurrentUser(userObj) {
  if (!userObj) return;

  const email = userObj.email || 'user@example.com';
  const role = userObj.role || 'member';
  const name = userObj.name || (String(role).toLowerCase().includes('pm') ? 'Priya Sharma (PM)' : 'Team Member');
  const isPm = ['pm', 'product_manager', 'product manager', 'admin', 'owner'].includes(String(role).toLowerCase()) || PRODUCT_MANAGER_EMAILS.includes(email.toLowerCase());
  const roleTitle = userObj.roleTitle || (isPm ? 'Product Manager' : 'Team Member');
  const avatar = userObj.avatar || (isPm 
    ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');

  const fullUser = {
    ...userObj,
    id: userObj.id || userObj._id || 'u_' + Date.now(),
    email,
    role,
    name,
    roleTitle,
    avatar,
  };

  localStorage.setItem('currentUser', JSON.stringify(fullUser));
  localStorage.setItem('demo_email', email);
  localStorage.setItem('demo_role', role);
  localStorage.setItem('demo_name', name);
  localStorage.setItem('demo_role_title', roleTitle);
  localStorage.setItem('demo_avatar', avatar);

  if (userObj.token || userObj.access_token) {
    localStorage.setItem('token', userObj.token || userObj.access_token);
  }
}

export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('demo_email');
  localStorage.removeItem('demo_role');
  localStorage.removeItem('demo_name');
  localStorage.removeItem('demo_role_title');
  localStorage.removeItem('demo_avatar');
}

export function isProductManager(userOverride = null) {
  const user = userOverride || getCurrentUser();
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  if (['pm', 'product_manager', 'product manager', 'admin', 'owner'].includes(role)) {
    return true;
  }
  return PRODUCT_MANAGER_EMAILS.includes(String(user.email || '').toLowerCase());
}

export function canAccessWorkspace(workspace, userOverride = null) {
  if (!workspace) return false;
  const user = userOverride || getCurrentUser();

  // Product Manager has global access to all workspaces
  if (isProductManager(user)) {
    return true;
  }

  // Workspace owner has access
  if (workspace.owner_id && (workspace.owner_id === user.id || workspace.owner_id === user.email)) {
    return true;
  }

  // Check if user is in workspace.members
  if (Array.isArray(workspace.members)) {
    return workspace.members.some((m) => {
      if (typeof m === 'string') return m.toLowerCase() === user.email.toLowerCase();
      return m.email && m.email.toLowerCase() === user.email.toLowerCase();
    });
  }

  return true;
}

export function getStoredWorkspaces() {
  try {
    const raw = localStorage.getItem('cached_workspaces');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return [
    {
      id: 'default-workspace',
      _id: 'default-workspace',
      name: 'Product Intelligence Workspace',
      description: 'Customer Feedback & Intelligence Hub',
      members_count: 3,
      members: ['user@example.com', 'pm@demo.com']
    }
  ];
}

export function setStoredWorkspaces(workspaces) {
  if (Array.isArray(workspaces) && workspaces.length > 0) {
    try {
      localStorage.setItem('cached_workspaces', JSON.stringify(workspaces));
      const currentActive = localStorage.getItem('active_workspace_id');
      const exists = workspaces.some((w) => (w.id || w._id) === currentActive);
      if (!currentActive || !exists) {
        const firstId = workspaces[0].id || workspaces[0]._id;
        setActiveWorkspaceId(firstId);
      }
    } catch {}
  }
}

export function getActiveWorkspaceId() {
  const stored = localStorage.getItem('active_workspace_id');
  if (stored) return stored;
  const workspaces = getStoredWorkspaces();
  if (workspaces.length > 0) {
    const firstId = workspaces[0].id || workspaces[0]._id;
    if (firstId) {
      localStorage.setItem('active_workspace_id', firstId);
      return firstId;
    }
  }
  return 'default-workspace';
}

export function setActiveWorkspaceId(workspaceId) {
  if (!workspaceId) return;
  const current = localStorage.getItem('active_workspace_id');
  if (current !== workspaceId) {
    localStorage.setItem('active_workspace_id', workspaceId);
    window.dispatchEvent(
      new CustomEvent('active_workspace_changed', { detail: { workspaceId } })
    );
  }
}

export function subscribeToActiveWorkspace(callback) {
  const handler = (e) => {
    if (callback && e.detail?.workspaceId) {
      callback(e.detail.workspaceId);
    }
  };
  window.addEventListener('active_workspace_changed', handler);
  return () => window.removeEventListener('active_workspace_changed', handler);
}

export function getWorkspaceById(workspaceId) {
  const targetId = workspaceId || getActiveWorkspaceId();
  const workspaces = getStoredWorkspaces();
  const matched = workspaces.find((ws) => (ws.id || ws._id) === targetId);
  if (matched) return matched;
  return {
    id: targetId || 'default-workspace',
    _id: targetId || 'default-workspace',
    name: 'Product Intelligence Workspace',
    description: 'Active Workspace Hub',
    members_count: 3,
    members: ['user@example.com', 'pm@demo.com']
  };
}

/* =========================================
   SESSION WORKSPACE ACCESS CACHE (0ms Lag)
   ========================================= */
const validatedWorkspacesSet = new Set();

export function isValidatedWorkspace(workspaceId) {
  if (!workspaceId) return false;
  if (validatedWorkspacesSet.has(workspaceId)) return true;
  try {
    const sessionVal = sessionStorage.getItem(`ws_validated_${workspaceId}`);
    if (sessionVal === 'true') {
      validatedWorkspacesSet.add(workspaceId);
      return true;
    }
  } catch {}
  return false;
}

export function markWorkspaceValidated(workspaceId) {
  if (!workspaceId) return;
  validatedWorkspacesSet.add(workspaceId);
  try {
    sessionStorage.setItem(`ws_validated_${workspaceId}`, 'true');
  } catch {}
}

/* =========================================
   GLOBAL PRODUCT ID SCOPE MANAGEMENT
   ========================================= */
export function getActiveProductId() {
  try {
    return localStorage.getItem('active_product_id') || '';
  } catch {
    return '';
  }
}

export function setActiveProductId(productId) {
  const newId = productId || '';
  const current = getActiveProductId();
  if (current !== newId) {
    try {
      localStorage.setItem('active_product_id', newId);
    } catch {}
    window.dispatchEvent(
      new CustomEvent('active_product_changed', { detail: { productId: newId } })
    );
  }
}

export function subscribeToActiveProduct(callback) {
  const handler = (e) => {
    if (callback) {
      callback(e.detail?.productId || '');
    }
  };
  window.addEventListener('active_product_changed', handler);
  return () => window.removeEventListener('active_product_changed', handler);
}

/* =========================================
   GLOBAL DATASET / FEEDBACK BATCH SCOPE MANAGEMENT
   ========================================= */
export function getActiveDatasetId() {
  try {
    return sessionStorage.getItem('active_dataset_id') || localStorage.getItem('active_dataset_id') || '';
  } catch {
    return '';
  }
}

export function getActiveDataset() {
  try {
    const raw = sessionStorage.getItem('active_dataset_obj') || localStorage.getItem('active_dataset_obj');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function setActiveDataset(datasetObj) {
  if (!datasetObj) {
    try {
      sessionStorage.removeItem('active_dataset_obj');
      localStorage.removeItem('active_dataset_obj');
    } catch {}
    return;
  }
  try {
    sessionStorage.setItem('active_dataset_obj', JSON.stringify(datasetObj));
    localStorage.setItem('active_dataset_obj', JSON.stringify(datasetObj));
  } catch {}
}

export function setActiveDatasetId(datasetId, datasetObj = null) {
  const newId = datasetId || '';
  const current = getActiveDatasetId();
  try {
    sessionStorage.setItem('active_dataset_id', newId);
    localStorage.setItem('active_dataset_id', newId);
    if (datasetObj) {
      setActiveDataset(datasetObj);
    } else if (!newId) {
      setActiveDataset(null);
    }
  } catch {}

  window.dispatchEvent(
    new CustomEvent('active_dataset_changed', { 
      detail: { 
        datasetId: newId, 
        dataset: datasetObj || getActiveDataset() 
      } 
    })
  );
}

export function subscribeToActiveDataset(callback) {
  if (callback) {
    try {
      // Synchronously emit current session value so components have state immediately
      callback(getActiveDatasetId(), getActiveDataset());
    } catch (err) {
      console.warn('Error in immediate active dataset subscriber callback:', err);
    }
  }
  const handler = (e) => {
    if (callback) {
      callback(e.detail?.datasetId || '', e.detail?.dataset || null);
    }
  };
  window.addEventListener('active_dataset_changed', handler);
  return () => window.removeEventListener('active_dataset_changed', handler);
}

