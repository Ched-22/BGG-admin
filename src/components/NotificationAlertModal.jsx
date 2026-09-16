import React from 'react';
import { Button, Modal } from './ui';
import { severityChip } from '../lib/notificationApi';

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

export function NotificationAlertModal({ notification, onOk, onOpenPanel }) {
  if (!notification) return null;

  return (
    <Modal
      open
      dismissable={false}
      layer="alert"
      title={notification.title}
      sub={formatWhen(notification.createdAt)}
      footer={(
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {onOpenPanel ? (
            <Button variant="ghost" onClick={onOpenPanel}>
              Ver notificações
            </Button>
          ) : null}
          <Button autoFocus onClick={onOk}>
            OK
          </Button>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className={`status-chip chip-${severityChip(notification.severity)}`} style={{ alignSelf: 'flex-start' }}>
          {notification.severity === 'warn' ? 'Atenção' : notification.severity === 'success' ? 'Sucesso' : 'Alerta'}
        </span>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{notification.body}</p>
      </div>
    </Modal>
  );
}
