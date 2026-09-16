import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDismissedId,
  buildPopupCandidates,
  isPopupWorthyNotification,
  isTaskScheduledForToday,
  mergePopupQueue,
  readDismissedIds,
} from './notificationPopupUtils.js';

const STORAGE_KEY = 'test-dismissed-popup-ids';

function mockSessionStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

describe('notificationPopupUtils', () => {
  it('buildPopupCandidates sorts by createdAt ascending and filters read/dismissed', () => {
    const notifications = [
      { id: 'b', type: 'QUOTE_PENDING_APPROVAL', readAt: null, createdAt: '2026-01-02T10:00:00.000Z' },
      { id: 'a', type: 'QUOTE_PENDING_APPROVAL', readAt: null, createdAt: '2026-01-01T10:00:00.000Z' },
      { id: 'c', type: 'CHECKLIST_ENTRY_PENDING', readAt: null, createdAt: '2026-01-03T10:00:00.000Z' },
      { id: 'd', type: 'TASK_ASSIGNED', readAt: null, createdAt: '2026-01-04T10:00:00.000Z' },
    ];
    const result = buildPopupCandidates(notifications, []);
    assert.deepEqual(result.map((n) => n.id), ['a', 'b']);
  });

  it('buildPopupCandidates includes TASK_SCHEDULED only when scheduled for today', () => {
    const now = new Date('2026-06-27T12:00:00.000Z');
    const notifications = [
      {
        id: 'today',
        type: 'TASK_SCHEDULED',
        readAt: null,
        createdAt: '2026-06-27T08:00:00.000Z',
        body: 'Cliente A — 2026-06-27 às 10:00',
      },
      {
        id: 'later',
        type: 'TASK_SCHEDULED',
        readAt: null,
        createdAt: '2026-06-27T08:00:00.000Z',
        body: 'Cliente B — 2026-06-28 às 10:00',
      },
    ];
    const result = buildPopupCandidates(notifications, [], now);
    assert.deepEqual(result.map((n) => n.id), ['today']);
  });

  it('isPopupWorthyNotification excludes checklist and assignment types', () => {
    assert.equal(isPopupWorthyNotification({ type: 'CHECKLIST_ENTRY_PENDING' }), false);
    assert.equal(isPopupWorthyNotification({ type: 'TASK_ASSIGNED' }), false);
    assert.equal(isPopupWorthyNotification({ type: 'QUOTE_PENDING_APPROVAL' }), true);
  });

  it('isTaskScheduledForToday matches iso and br date in body', () => {
    const now = new Date('2026-06-27T12:00:00.000Z');
    assert.equal(
      isTaskScheduledForToday({ body: 'Cliente — 27/06/2026 às 09:00' }, now),
      true,
    );
    assert.equal(
      isTaskScheduledForToday({ body: 'Cliente — 2026-06-28 às 09:00' }, now),
      false,
    );
  });

  it('addDismissedId persists ids in sessionStorage', () => {
    const storage = mockSessionStorage();
    assert.deepEqual(addDismissedId('n1', STORAGE_KEY, storage), ['n1']);
    assert.deepEqual(addDismissedId('n2', STORAGE_KEY, storage), ['n1', 'n2']);
    assert.deepEqual(readDismissedIds(STORAGE_KEY, storage), ['n1', 'n2']);
    assert.deepEqual(addDismissedId('n1', STORAGE_KEY, storage), ['n1', 'n2']);
  });

  it('mergePopupQueue keeps order by createdAt without duplicates', () => {
    const prev = [{ id: 'a', createdAt: '2026-01-01T10:00:00.000Z' }];
    const candidates = [
      { id: 'b', createdAt: '2026-01-02T10:00:00.000Z' },
      { id: 'a', createdAt: '2026-01-01T10:00:00.000Z' },
    ];
    const merged = mergePopupQueue(prev, candidates);
    assert.deepEqual(merged.map((n) => n.id), ['a', 'b']);
  });
});
