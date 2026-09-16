import { useAuth } from '../context/AuthContext';

export function isAdminUser(user) {
  return user?.role === 'ADMIN';
}

export function isTechnicianUser(user) {
  return user?.role === 'TECHNICIAN';
}

export function canAccessAdmin(user) {
  return isAdminUser(user) || isTechnicianUser(user);
}

export function isReadOnlyPage(pageId) {
  return pageId !== 'quotes';
}

export function isPageReadOnlyForUser(user, pageId) {
  return isTechnicianUser(user) && isReadOnlyPage(pageId);
}

export function canWritePage(user, pageId) {
  if (isAdminUser(user)) return true;
  if (isTechnicianUser(user)) return pageId === 'quotes';
  return false;
}

export function canApproveQuotes(user) {
  return isAdminUser(user);
}

export function canManageTasks(user) {
  return isAdminUser(user);
}

export function canManageInventory(user) {
  return isAdminUser(user);
}

export function canManageClients(user) {
  return isAdminUser(user);
}

export function canManageTechnicians(user) {
  return isAdminUser(user);
}

export function canViewTaskActivityLog(user) {
  return isAdminUser(user);
}

export function usePermissions() {
  const { user } = useAuth();
  return {
    user,
    isAdmin: isAdminUser(user),
    isTechnician: isTechnicianUser(user),
    isPageReadOnly: (pageId) => isPageReadOnlyForUser(user, pageId),
    canWritePage: (pageId) => canWritePage(user, pageId),
    canApproveQuotes: canApproveQuotes(user),
    canManageTasks: canManageTasks(user),
    canManageInventory: canManageInventory(user),
    canManageClients: canManageClients(user),
    canManageTechnicians: canManageTechnicians(user),
    canViewTaskActivityLog: canViewTaskActivityLog(user),
  };
}
