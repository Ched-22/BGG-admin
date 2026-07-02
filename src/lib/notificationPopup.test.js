import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDismissedId,
  buildPopupCandidates,
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
      { id: 'b', readAt: null, createdAt: '2026-01-02T10:00:00.000Z' },
      { id: 'a', readAt: null, createdAt: '2026-01-01T10:00:00.000Z' },
      { id: 'c', readAt: '2026-01-03T10:00:00.000Z', createdAt: '2026-01-03T10:00:00.000Z' },
      { id: 'd', readAt: null, createdAt: '2026-01-04T10:00:00.000Z' },
    ];
    const result = buildPopupCandidates(notifications, ['d']);
    assert.deepEqual(result.map((n) => n.id), ['a', 'b']);
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
