import React, { useCallback, useEffect, useState } from 'react';
import { Button, Icon, Modal } from './ui';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  severityChip,
} from '../lib/notificationApi';

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function NotificationPanel({ open, onClose, onAction, onUnreadChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotifications({ limit: 30, unreadOnly: true });
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleItemClick = async (item) => {
    if (!item.readAt && !item.derived) {
      try {
        await markNotificationRead(item.id);
      } catch { /* ignore */ }
    }
    setItems((prev) => prev.filter((n) => n.id !== item.id));
    onUnreadChange?.();
    if (item.action && onAction) {
      onAction(item.action);
    }
    onClose();
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      await load();
      onUnreadChange?.();
    } catch { /* ignore */ }
  };

  return (
    <Modal open={open} onClose={onClose} title="Notificações" size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" onClick={handleMarkAll} disabled={loading || !items.length}>
            Marcar todas como lidas
          </Button>
        </div>

        {loading ? (
          <div className="muted" style={{ padding: 16, textAlign: 'center' }}>Carregando…</div>
        ) : null}

        {!loading && !items.length ? (
          <div className="muted" style={{ padding: 16, textAlign: 'center' }}>Nenhuma notificação</div>
        ) : null}

        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemClick(item)}
            style={{
              textAlign: 'left',
              padding: 12,
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: item.readAt ? 'transparent' : 'rgba(181, 235, 12,0.06)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{item.title}</span>
              {!item.readAt ? (
                <span className={`status-chip chip-${severityChip(item.severity)}`} style={{ fontSize: 9 }}>
                  Novo
                </span>
              ) : null}
              <span className="muted" style={{ fontSize: 10 }}>{formatWhen(item.createdAt)}</span>
              {item.action ? <Icon.Chevron size={12} /> : null}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>{item.body}</div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
