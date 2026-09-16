import api from './api';
import { getStoredUser } from './auth';
import { DEFAULT_PHONE_COUNTRY_CODE } from './phoneCountries';
import { formatPhoneDisplay } from './phoneUtils';
import { DEFAULT_CLIENT_LANGUAGE } from './clientLanguage';

const CLOSED_TASK_STATUSES = new Set(['Cancelado', 'Concluído']);

export function isClosedTaskStatus(status) {
  return CLOSED_TASK_STATUSES.has(status);
}

export function countOpenTasks(tasks) {
  return (Array.isArray(tasks) ? tasks : []).filter(
    (task) => !isClosedTaskStatus(task.status),
  ).length;
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function asObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const PT_LOG_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function formatLogWhen(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getDate()} ${PT_LOG_MONTHS[date.getMonth()]} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatActivityWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return formatLogWhen(d);
}

function formatActorDisplay(name, role) {
  const trimmedName = name?.trim();
  const roleLabel = role === 'TECHNICIAN'
    ? 'Técnico'
    : role === 'ADMIN'
      ? 'Admin'
      : role;
  if (trimmedName && roleLabel && trimmedName.toLowerCase() !== roleLabel.toLowerCase()) {
    return `${trimmedName} · ${roleLabel}`;
  }
  return trimmedName || roleLabel || '—';
}

export function normalizeActivityLog(entries = []) {
  return entries
    .map((entry, index) => {
      if (entry.action && entry.label) {
        return {
          id: `${entry.at || index}-${index}`,
          label: entry.label,
          actorName: entry.actorName || '—',
          actorRole: entry.actorRole,
          actorDisplay: formatActorDisplay(entry.actorName, entry.actorRole),
          at: entry.at,
          displayWhen: formatActivityWhen(entry.at),
        };
      }
      return {
        id: `legacy-${index}`,
        label: entry.t || '—',
        actorName: entry.w || '—',
        actorDisplay: entry.w || '—',
        at: null,
        displayWhen: entry.when || '—',
      };
    })
    .sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0;
      const tb = b.at ? new Date(b.at).getTime() : 0;
      return tb - ta;
    });
}

function viewerRole() {
  return getStoredUser()?.role;
}

export function mapTaskFromApi(row, options = {}) {
  if (!row) return null;

  const role = options.viewerRole ?? viewerRole();
  const hideLog = role === 'TECHNICIAN';
  const rawLog = hideLog ? [] : asArray(row.log);

  const endereco = asObject(row.endereco, {
    unidade: '—',
    logradouro: '—',
    cidade: '—',
    estado: '—',
    cep: '—',
  });
  const orcamento = asObject(row.orcamento, {
    valor: 0,
    status: 'Pendente',
    fatura: '—',
    metodo: '—',
    deposito: 0,
    saldo: 0,
  });
  const qa = asObject(row.qa, { status: '—', notas: '', fotos: [], concluidoEm: '' });
  const duracaoHoras = row.duracaoHoras ?? (row.duracao ? row.duracao / 60 : null);

  const clienteTelCountryCode = row.clienteTelCountryCode || null;
  const clienteTelNationalNumber = row.clienteTelNationalNumber || null;

  return {
    _raw: row,
    apiId: row.id,
    id: row.displayId,
    projeto: row.projeto,
    cliente: row.cliente,
    clienteEmail: row.clienteEmail || '—',
    clienteTelCountryCode,
    clienteTelNationalNumber,
    clienteTel: clienteTelCountryCode && clienteTelNationalNumber
      ? formatPhoneDisplay(clienteTelCountryCode, clienteTelNationalNumber)
      : '—',
    servico: row.servico,
    serviceCodes: Array.isArray(row.serviceCodes) ? row.serviceCodes : [],
    status: row.status,
    descricao: row.descricao,
    endereco,
    dataAgendada: row.dataAgendada || '',
    horario: row.horario || '',
    clientDropoffDate: row.clientDropoffDate || '',
    clientDropoffTime: row.clientDropoffTime || '',
    baia: row.baia ?? undefined,
    duracaoHoras: duracaoHoras ?? undefined,
    duracao: duracaoHoras != null ? Math.round(duracaoHoras * 60) : undefined,
    dataCriacao: formatDateTime(row.createdAt),
    ultimaAtualizacao: formatDateTime(row.updatedAt),
    tecnico: row.tecnico || '',
    tecnicoStatus: row.tecnicoStatus || '—',
    tecnicoNotas: row.tecnicoNotas || '',
    orcamento,
    anexos: asArray(row.anexos),
    qa,
    agendaPreferencial: row.agendaPreferencial || '—',
    log: rawLog,
    activityLog: hideLog ? [] : normalizeActivityLog(rawLog),
    clientePreferredLanguage: row.clientePreferredLanguage || DEFAULT_CLIENT_LANGUAGE,
  };
}

export function mapTasksFromApi(data, options = {}) {
  return (Array.isArray(data) ? data : []).map((row) => mapTaskFromApi(row, options)).filter(Boolean);
}

export function mapCreateTaskToApi(data) {
  return {
    projeto: data.projeto?.trim() || '',
    servico: data.servico?.trim() || '',
    descricao: data.descricao?.trim() || '',
    anotInternas: data.anotInternas?.trim() || undefined,
    cliente: data.cliente?.trim() || '',
    clienteEmail: data.clienteEmail?.trim() || undefined,
    clienteTelCountryCode: data.clienteTelCountryCode
      ? String(data.clienteTelCountryCode).replace(/\D/g, '')
      : undefined,
    clienteTelNationalNumber: data.clienteTelNationalNumber
      ? String(data.clienteTelNationalNumber).replace(/\D/g, '')
      : undefined,
    clientId: data.clientId || undefined,
    plate: data.plate?.trim() || '',
    plateCountry: data.plateCountry || 'ES',
    brand: data.brand?.trim() || '',
    model: data.model?.trim() || '',
    year: Number(data.year) || new Date().getFullYear(),
    addressUnit: data.unidade?.trim() || '',
    street: data.logradouro?.trim() || undefined,
    city: data.cidade?.trim() || '',
    state: data.estado?.trim() || '',
    zipCode: data.cep?.trim() || '',
    anotPropriedade: data.anotPropriedade?.trim() || undefined,
    dataAgendada: data.data?.trim() || undefined,
    horario: data.horario?.trim() || undefined,
    clientePreferredLanguage: data.clientePreferredLanguage || DEFAULT_CLIENT_LANGUAGE,
  };
}

export async function listTasks() {
  const { data } = await api.get('/tasks');
  return mapTasksFromApi(data);
}

export async function createTask(body) {
  const { data } = await api.post('/tasks', body);
  return mapTaskFromApi(data);
}

const SCHEDULED_FROM_STATUSES = new Set([
  'Nova solicitação',
  'Não agendado',
  'Sem técnico',
  'Aguardando orçamento',
]);

export function statusAfterSchedule(currentStatus) {
  return SCHEDULED_FROM_STATUSES.has(currentStatus) ? 'Agendado' : currentStatus;
}

export function statusAfterAssign(currentStatus) {
  return currentStatus === 'Sem técnico' ? 'Agendado' : currentStatus;
}

export function mapPatchToApi(patch) {
  const body = {};
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.tecnico !== undefined) body.tecnico = patch.tecnico;
  if (patch.tecnicoStatus !== undefined) body.tecnicoStatus = patch.tecnicoStatus;
  if (patch.tecnicoNotas !== undefined) body.tecnicoNotas = patch.tecnicoNotas;
  if (patch.dataAgendada !== undefined) body.dataAgendada = patch.dataAgendada || null;
  if (patch.horario !== undefined) body.horario = patch.horario || null;
  if (patch.clientDropoffDate !== undefined) {
    body.clientDropoffDate = patch.clientDropoffDate || null;
  }
  if (patch.clientDropoffTime !== undefined) {
    body.clientDropoffTime = patch.clientDropoffTime || null;
  }
  if (patch.baia !== undefined) body.baia = patch.baia ?? null;
  if (patch.duracaoHoras !== undefined) body.duracaoHoras = patch.duracaoHoras ?? null;
  if (patch.orcamento !== undefined) body.orcamento = patch.orcamento;
  if (patch.qa !== undefined) body.qa = patch.qa;
  if (patch.logAction) body.logAction = patch.logAction;
  if (patch.logMeta) body.logMeta = patch.logMeta;
  return body;
}

export async function patchTask(taskId, patch) {
  const { data } = await api.patch(`/tasks/${encodeURIComponent(taskId)}`, mapPatchToApi(patch));
  return mapTaskFromApi(data);
}

export async function notifyReadyForPickup(taskId, qaNotes) {
  const { data } = await api.patch(
    `/tasks/${encodeURIComponent(taskId)}/notify-ready-for-pickup`,
    { qaNotes: qaNotes || undefined },
  );
  return mapTaskFromApi(data);
}
