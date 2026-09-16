import { useCallback, useEffect, useRef, useState } from 'react';
import { listNotifications } from './notificationApi';
import {
  addDismissedId,
  buildPopupCandidates,
  DISMISSED_STORAGE_KEY,
  getPollIntervalMs,
  mergePopupQueue,
  readDismissedIds,
} from './notificationPopupUtils';

export {
  addDismissedId,
  buildPopupCandidates,
  DISMISSED_STORAGE_KEY,
  getPollIntervalMs,
  mergePopupQueue,
  readDismissedIds,
} from './notificationPopupUtils';

function resolvePollIntervalMs() {
  return getPollIntervalMs(import.meta.env.VITE_NOTIFICATION_POPUP_POLL_MS);
}

function isForeground() {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}

export function useNotificationPopup({ enabled, storageKey = DISMISSED_STORAGE_KEY }) {
  const [current, setCurrent] = useState(null);
  const queueRef = useRef([]);

  const syncCurrentFromQueue = useCallback(() => {
    const next = queueRef.current[0] ?? null;
    setCurrent(next);
  }, []);

  const poll = useCallback(async () => {
    if (!enabled || !isForeground()) return;
    try {
      const res = await listNotifications({ unreadOnly: true, limit: 20 });
      const items = Array.isArray(res?.data) ? res.data : [];
      const dismissed = readDismissedIds(storageKey);
      const candidates = buildPopupCandidates(items, dismissed);
      queueRef.current = mergePopupQueue(queueRef.current, candidates).filter(
        (n) => !dismissed.includes(n.id),
      );
      syncCurrentFromQueue();
    } catch {
      /* ignore poll errors */
    }
  }, [enabled, storageKey, syncCurrentFromQueue]);

  useEffect(() => {
    if (!enabled) {
      queueRef.current = [];
      setCurrent(null);
      return undefined;
    }

    poll();
    const timer = setInterval(poll, resolvePollIntervalMs());
    const onVisibility = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      queueRef.current = [];
      setCurrent(null);
    };
  }, [enabled, poll]);

  const dismissCurrent = useCallback(() => {
    const active = queueRef.current[0];
    if (!active) return;
    addDismissedId(active.id, storageKey);
    queueRef.current = queueRef.current.filter((n) => n.id !== active.id);
    syncCurrentFromQueue();
  }, [storageKey, syncCurrentFromQueue]);

  return { current, dismissCurrent, poll };
}
