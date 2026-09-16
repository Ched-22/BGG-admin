import { formatEUR } from './currency.js';
import { needsRestock } from './stock';
import { getEventSlot, slotsOverlap } from './scheduling';
import { isClosedTaskStatus } from './taskApi';

const PAYMENT_FAIL_RE = /pagamento\s+(com\s+)?falha|falha\s+no\s+pagamento|pagamento\s+recusado/i;
const PAYMENT_OK_RE = /pagamento\s+recebido|depósito\s+recebido|pagamento\s+confirmado/i;
const CANCELLED_RE = /cancelad/i;

function parseTimestamp(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  const iso = String(value).includes('T') ? value : String(value).replace(' ', 'T');
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function taskSortAt(task) {
  return parseTimestamp(task._raw?.updatedAt || task._raw?.createdAt || task.ultimaAtualizacao);
}

export function formatRelativeWhen(value) {
  const then = parseTimestamp(value);
  if (!then) return value || '—';
  const diffMs = Date.now() - then;
  if (diffMs < 0) return 'agora';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? 'há 1 h' : `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'há 1 semana';
  if (weeks < 5) return `há ${weeks} semanas`;
  const months = Math.floor(days / 30);
  return months <= 1 ? 'há 1 mês' : `há ${months} meses`;
}

function taskDesc(task, includeValue = true) {
  const valor = task.orcamento?.valor || 0;
  const base = `${task.id} — ${task.cliente}`;
  return includeValue && valor ? `${base} · ${formatEUR(valor)}` : base;
}

function pushAlert(alerts, seen, alert) {
  const key = `${alert.kind}|${alert.title}|${alert.desc}`;
  if (seen.has(key)) return;
  seen.add(key);
  alerts.push(alert);
}

function findScheduleConflicts(tasks) {
  const scheduled = tasks.filter(
    (t) => t.dataAgendada && t.horario && t.tecnico && !isClosedTaskStatus(t.status),
  );
  const pairs = [];

  for (let i = 0; i < scheduled.length; i += 1) {
    for (let j = i + 1; j < scheduled.length; j += 1) {
      const a = scheduled[i];
      const b = scheduled[j];
      if (a.tecnico !== b.tecnico || a.dataAgendada !== b.dataAgendada) continue;
      const slotA = getEventSlot({ ...a, data: a.dataAgendada });
      const slotB = getEventSlot({ ...b, data: b.dataAgendada });
      if (!slotsOverlap(slotA, slotB)) continue;
      pairs.push({ a, b, sortAt: Math.max(taskSortAt(a), taskSortAt(b)) });
    }
  }

  return pairs;
}

export function buildDashboardAlerts({ tasks = [], inventory = [], technicians = [] } = {}) {
  const alerts = [];
  const seen = new Set();
  const weekAgo = Date.now() - 7 * 86400000;
  const techRows = Array.isArray(technicians) ? technicians : (technicians?.data || []);
  const taskRows = Array.isArray(tasks) ? tasks : [];
  const inventoryRows = Array.isArray(inventory) ? inventory : [];

  for (const task of taskRows) {
    const orc = task.orcamento || {};
    const sortAt = taskSortAt(task);

    if (/falha|recusado|negado/i.test(orc.status || '')) {
      pushAlert(alerts, seen, {
        kind: 'danger',
        title: 'Pagamento com falha',
        desc: taskDesc(task),
        when: formatRelativeWhen(task.ultimaAtualizacao),
        sortAt,
      });
    }

    for (const entry of task.log || []) {
      const text = entry.t || '';
      if (PAYMENT_FAIL_RE.test(text)) {
        pushAlert(alerts, seen, {
          kind: 'danger',
          title: 'Pagamento com falha',
          desc: taskDesc(task),
          when: entry.when || formatRelativeWhen(task.ultimaAtualizacao),
          sortAt,
        });
      } else if (PAYMENT_OK_RE.test(text)) {
        pushAlert(alerts, seen, {
          kind: 'success',
          title: 'Pagamento recebido',
          desc: taskDesc(task),
          when: entry.when || formatRelativeWhen(task.ultimaAtualizacao),
          sortAt,
        });
      }
    }

    if (task.status === 'Cancelado' && sortAt >= weekAgo) {
      const cancelLog = (task.log || []).find((e) => CANCELLED_RE.test(e.t || ''));
      pushAlert(alerts, seen, {
        kind: 'neutral',
        title: 'Tarefa cancelada',
        desc: taskDesc(task, false),
        when: cancelLog?.when || formatRelativeWhen(task.ultimaAtualizacao),
        sortAt,
      });
    }
  }

  for (const { a, b, sortAt } of findScheduleConflicts(taskRows)) {
    pushAlert(alerts, seen, {
      kind: 'warn',
      title: `Conflito de agenda — ${a.tecnico}`,
      desc: `Tarefas ${a.id} e ${b.id} no mesmo horário`,
      when: formatRelativeWhen(a.ultimaAtualizacao),
      sortAt,
    });
  }

  for (const tech of techRows.filter((t) => t.hasScheduleConflict)) {
    const techTasks = taskRows.filter(
      (t) => t.tecnico === tech.name && t.dataAgendada && !isClosedTaskStatus(t.status),
    );
    if (techTasks.length >= 2) continue;
    pushAlert(alerts, seen, {
      kind: 'warn',
      title: `Conflito de agenda — ${tech.name}`,
      desc: techTasks.length
        ? `Verifique a agenda de ${tech.name} (${techTasks.map((t) => t.id).join(', ')})`
        : `Verifique a agenda de ${tech.name}`,
      when: 'agora',
      sortAt: Date.now(),
    });
  }

  for (const product of inventoryRows.filter(needsRestock)) {
    pushAlert(alerts, seen, {
      kind: 'warn',
      title: 'Estoque crítico',
      desc: `${product.nome} (${product.sku}) — abaixo de 20% da capacidade`,
      when: 'agora',
      sortAt: Date.now(),
    });
  }

  return alerts
    .sort((a, b) => (b.sortAt || 0) - (a.sortAt || 0))
    .slice(0, 20)
    .map(({ sortAt, ...rest }) => rest);
}

export function greetingFirstName(user) {
  if (!user?.name) return 'Admin';
  return user.name.split(/\s+/)[0];
}
