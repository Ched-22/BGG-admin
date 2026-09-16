export const DISMISSED_STORAGE_KEY = 'bgg-dismissed-popup-ids';

/** Types that trigger a blocking popup; other unread items stay in the bell only. */
export const POPUP_NOTIFICATION_TYPES = new Set([
  'QUOTE_PENDING_APPROVAL',
  'QUOTE_APPROVED',
  'TASK_SCHEDULED',
  'TASK_COMPLETED',
  'QA_PENDING_REVIEW',
]);

export function isTaskScheduledForToday(notification, now = new Date()) {
  const body = String(notification?.body || '');
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const iso = `${year}-${month}-${day}`;
  const br = `${day}/${month}/${year}`;
  return body.includes(iso) || body.includes(br);
}

export function isPopupWorthyNotification(notification, now = new Date()) {
  if (!notification?.type || !POPUP_NOTIFICATION_TYPES.has(notification.type)) {
    return false;
  }
  if (notification.type === 'TASK_SCHEDULED' && !isTaskScheduledForToday(notification, now)) {
    return false;
  }
  return true;
}

export function getPollIntervalMs(envValue) {
  const n = Number(envValue);
  return Number.isFinite(n) && n > 0 ? n : 30000;
}

export function readDismissedIds(storageKey = DISMISSED_STORAGE_KEY, storage = sessionStorage) {
  try {
    const raw = storage.getItem(storageKey);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function addDismissedId(id, storageKey = DISMISSED_STORAGE_KEY, storage = sessionStorage) {
  if (!id) return readDismissedIds(storageKey, storage);
  const ids = readDismissedIds(storageKey, storage);
  if (ids.includes(id)) return ids;
  const next = [...ids, id];
  storage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export function buildPopupCandidates(notifications, dismissedIds, now = new Date()) {
  if (!Array.isArray(notifications)) return [];
  const dismissed = new Set(dismissedIds);
  return notifications
    .filter((n) => n?.id && n.readAt == null && !dismissed.has(n.id) && isPopupWorthyNotification(n, now))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function mergePopupQueue(prevQueue, candidates) {
  const byId = new Map(prevQueue.map((n) => [n.id, n]));
  for (const item of candidates) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
