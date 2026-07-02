export const DISMISSED_STORAGE_KEY = 'bgg-dismissed-popup-ids';

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

export function buildPopupCandidates(notifications, dismissedIds) {
  if (!Array.isArray(notifications)) return [];
  const dismissed = new Set(dismissedIds);
  return notifications
    .filter((n) => n?.id && n.readAt == null && !dismissed.has(n.id))
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
