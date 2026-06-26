import api from './api';

export async function listNotifications(params = {}) {
  const { data } = await api.get('/in-app-notifications', { params });
  return data;
}

export async function getUnreadCount() {
  const { data } = await api.get('/in-app-notifications/unread-count');
  return data?.unreadCount ?? 0;
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/in-app-notifications/${encodeURIComponent(id)}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch('/in-app-notifications/read-all');
  return data;
}

export function severityChip(severity) {
  if (severity === 'success') return 'ok';
  if (severity === 'warn') return 'warn';
  if (severity === 'gold') return 'gold';
  return 'info';
}
