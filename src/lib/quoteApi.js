import api from './api'
import { mapTaskFromApi } from './taskApi'
import { DEFAULT_PHONE_COUNTRY_CODE } from './phoneCountries'
import { formatPhoneDisplay } from './phoneUtils'
import { formatPlateDisplay } from './plateUtils'
import { DEFAULT_CLIENT_LANGUAGE } from './clientLanguage'
import {
  SERVICES_CATALOG,
} from '../data/orcamentoCatalog'

const STATUS_MAP = {
  DRAFT: 'Pendente',
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
}

const STATUS_MAP_REVERSE = {
  Pendente: 'DRAFT',
  Aprovado: 'APPROVED',
}

const SERVICES_LABELS = Object.fromEntries(
  SERVICES_CATALOG.map((s) => [s.id, s.name]),
)

function formatQuoteServices(row) {
  const snapshots = Array.isArray(row.serviceSnapshots) ? row.serviceSnapshots : []
  if (snapshots.length) {
    return snapshots.map((s) => s.name || s.code).filter(Boolean).join(', ') || '—'
  }
  const services = Array.isArray(row.services) ? row.services : []
  return services.map((s) => SERVICES_LABELS[s] || s).join(', ') || '—'
}

function snapshotSubtotal(snapshots) {
  if (!Array.isArray(snapshots) || !snapshots.length) return null
  return snapshots.reduce((sum, row) => sum + (Number(row.unitPrice) || 0), 0)
}

export function quoteSubtotalFromDetail(detail) {
  const fromSnapshots = snapshotSubtotal(detail?._raw?.serviceSnapshots)
  if (fromSnapshots != null) return fromSnapshots
  const discount = Number(detail?.discount) || 0
  const total = Number(detail?.valor) || 0
  return discount > 0 ? total + discount : total
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatRelativeAge(iso) {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const days = Math.floor(diffMs / 86400000)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'há 1 dia'
  if (days < 7) return `há ${days} dias`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return 'há 1 semana'
  if (weeks < 5) return `há ${weeks} semanas`
  const months = Math.floor(days / 30)
  if (months <= 1) return 'há 1 mês'
  return `há ${months} meses`
}

export function isQuotePending(quote) {
  if (!quote) return false
  const apiStatus = quote.statusApi || quote.status
  if (apiStatus === 'DRAFT' || apiStatus === 'PENDING') return true
  return quote.status === 'Pendente'
}

export function isQuoteDraft(quote) {
  if (!quote) return false
  return (quote.statusApi || quote.status) === 'DRAFT'
}

export function isQuoteSubmittedForApproval(quote) {
  if (!quote) return false
  return (quote.statusApi || quote.status) === 'PENDING'
}

export function emptyQuoteForm() {
  return {
    clientName: '',
    clientPhoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
    clientPhoneNationalNumber: '',
    clientEmail: '',
    clientExistente: false,
    clientId: undefined,
    clientPreferredLanguage: DEFAULT_CLIENT_LANGUAGE,
    plate: '',
    plateCountry: 'ES',
    brand: '',
    model: '',
    year: '',
    color: '',
    km: '',
    vehicleSize: 'medio',
    selected: {},
    discount: '0',
    override: '',
    notes: '',
    internalNote: '',
  }
}

export function mapQuotesFromApi(data) {
  const rows = Array.isArray(data)
    ? data
    : (Array.isArray(data?.data) ? data.data : []);
  return rows.map(mapQuoteFromApi).filter(Boolean);
}

export async function listQuotes(params = {}) {
  const { data } = await api.get('/quotes', { params });
  if (Array.isArray(data)) {
    return {
      data,
      page: 1,
      limit: data.length,
      total: data.length,
      totalPages: 1,
      pipeline: null,
    };
  }
  return {
    data: Array.isArray(data?.data) ? data.data : [],
    page: data?.page ?? 1,
    limit: data?.limit ?? 15,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    pipeline: data?.pipeline ?? null,
  };
}

export function quoteSortDate(quote) {
  const raw = quote?._raw
  const iso = raw?.submittedAt || raw?.updatedAt || raw?.createdAt
  return iso ? new Date(iso).getTime() : 0
}

export const UNSCHEDULED_QUOTE_DASHBOARD_HOURS = 72

export function quoteReferenceTimestamp(quote) {
  const raw = quote?._raw || {}
  const iso = raw.approvedAt || raw.submittedAt || raw.createdAt
  return iso ? new Date(iso).getTime() : 0
}

export function isQuoteApproved(quote) {
  if (!quote) return false
  const apiStatus = quote.statusApi || quote.status
  return apiStatus === 'APPROVED' || quote.status === 'Aprovado'
}

export function isQuoteScheduled(quote, tasks = []) {
  const linkedId = quote?.linkedTaskDisplayId
  if (!linkedId) return false
  const task = tasks.find((t) => t.id === linkedId)
  return !!(task?.dataAgendada)
}

export function isQuoteUnscheduled(quote, tasks = []) {
  return isQuoteApproved(quote) && !isQuoteScheduled(quote, tasks)
}

export function isWithinLastHours(timestampMs, hours = UNSCHEDULED_QUOTE_DASHBOARD_HOURS) {
  if (!timestampMs) return false
  return Date.now() - timestampMs <= hours * 60 * 60 * 1000
}

export function filterRecentUnscheduledQuotes(quotes, tasks, hours = UNSCHEDULED_QUOTE_DASHBOARD_HOURS) {
  return (Array.isArray(quotes) ? quotes : [])
    .filter((quote) => (
      isQuoteUnscheduled(quote, tasks)
      && isWithinLastHours(quoteReferenceTimestamp(quote), hours)
    ))
    .sort((a, b) => quoteReferenceTimestamp(b) - quoteReferenceTimestamp(a))
}

export function formatHoursSinceQuote(quote) {
  const ts = quoteReferenceTimestamp(quote)
  if (!ts) return '—'
  const hours = Math.floor((Date.now() - ts) / (60 * 60 * 1000))
  if (hours < 1) return 'há menos de 1 h'
  if (hours === 1) return 'há 1 h'
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'há 1 dia'
  return `há ${days} dias`
}

export function mapQuoteFromApi(row) {
  if (!row) return null

  const servico = formatQuoteServices(row)

  const ageSource = row.submittedAt || row.createdAt

  return {
    _raw: row,
    id: row.id,
    status: STATUS_MAP[row.status] || row.status,
    statusApi: row.status,

    cliente: row.clientName || '—',
    projeto: `${row.brand || ''} ${row.model || ''} · ${formatPlateDisplay(row.plate || '', row.plateCountry)}`.trim() || '—',
    servico,
    valor: Number(row.total) || 0,
    dataCriacao: formatDate(row.createdAt),
    idade: formatRelativeAge(ageSource),
    validade: row.submittedAt ? formatDate(new Date(new Date(row.submittedAt).getTime() + 7 * 86400000)) : '—',
    responsavel: row.createdBy?.name || '—',
    createdById: row.createdById || row.createdBy?.id || null,

    clientPhoneCountryCode: row.clientPhoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    clientPhoneNationalNumber: row.clientPhoneNationalNumber || '',
    clientPhone: formatPhoneDisplay(row.clientPhoneCountryCode, row.clientPhoneNationalNumber),
    clientEmail: row.clientEmail || '',
    plate: formatPlateDisplay(row.plate || '', row.plateCountry) || row.plate || '',
    plateRaw: row.plate || '',
    plateCountry: row.plateCountry || 'ES',
    brand: row.brand || '',
    model: row.model || '',
    year: row.year || '',
    color: row.color || '',
    km: row.km || '',
    vehicleSize: row.vehicleSize || '',
    discount: row.discount || 0,
    notes: row.notes || '',
    internalNote: row.internalNote || '',
    approvedAt: formatDate(row.approvedAt),
    createdAt: formatDate(row.createdAt),
    linkedTaskDisplayId: row.linkedTaskDisplayId || null,
    services: Array.isArray(row.services) ? row.services : [],
    clientPreferredLanguage: row.clientPreferredLanguage || DEFAULT_CLIENT_LANGUAGE,
    syncedClientId: row.syncedClientId || null,
  }
}

export function quoteToForm(quote) {
  if (!quote) return null
  const raw = quote._raw || {}
  const serviceIds = Array.isArray(quote.services)
    ? quote.services
    : [...(raw.services || [])]
  const selected = serviceIds.reduce((acc, id) => {
    if (id) acc[id] = true
    return acc
  }, {})

  const discount = Number(quote.discount ?? raw.discount ?? 0)
  const subtotalFromSnapshots = snapshotSubtotal(raw.serviceSnapshots)
  const computedTotal = subtotalFromSnapshots != null ? subtotalFromSnapshots - discount : null
  const storedTotal = Number(raw.total ?? quote.valor) || 0
  const hasManualTotal = computedTotal != null && Math.abs(storedTotal - computedTotal) > 0.009

  const syncedClientId = quote.syncedClientId || raw.syncedClientId || null

  return {
    clientName: quote.cliente !== '—' ? quote.cliente : raw.clientName || '',
    clientExistente: !!syncedClientId,
    clientId: syncedClientId || undefined,
    clientPhoneCountryCode: quote.clientPhoneCountryCode || raw.clientPhoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    clientPhoneNationalNumber: quote.clientPhoneNationalNumber || raw.clientPhoneNationalNumber || '',
    clientEmail: quote.clientEmail || raw.clientEmail || '',
    clientPreferredLanguage: quote.clientPreferredLanguage || raw.clientPreferredLanguage || DEFAULT_CLIENT_LANGUAGE,
    plate: quote.plate || raw.plate || '',
    plateCountry: quote.plateCountry || raw.plateCountry || 'ES',
    brand: quote.brand || raw.brand || '',
    model: quote.model || raw.model || '',
    year: quote.year != null && quote.year !== '' ? String(quote.year) : raw.year != null ? String(raw.year) : '',
    color: quote.color || raw.color || '',
    km: quote.km != null && quote.km !== '' ? String(quote.km) : raw.km != null ? String(raw.km) : '',
    vehicleSize: quote.vehicleSize || raw.vehicleSize || 'medio',
    selected,
    discount: String(discount),
    override: hasManualTotal ? String(storedTotal) : '',
    notes: quote.notes || raw.notes || '',
    internalNote: quote.internalNote || raw.internalNote || '',
  }
}

export function mapQuoteToApi(form, { linkedTaskDisplayId, servicesCatalog } = {}) {
  const serviceIds = Object.entries(form.selected || {})
    .filter(([, on]) => on)
    .map(([id]) => id)

  const override = form.override ?? ''
  const totalOverride = override !== '' && override != null ? Number(override) : undefined

  const body = {
    clientName: form.clientName?.trim() || '',
    clientPhoneCountryCode: String(form.clientPhoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE).replace(/\D/g, ''),
    clientPhoneNationalNumber: String(form.clientPhoneNationalNumber || '').replace(/\D/g, ''),
    clientEmail: form.clientEmail?.trim() || undefined,
    plate: form.plate?.trim() || '',
    plateCountry: form.plateCountry || 'ES',
    brand: form.brand?.trim() || '',
    model: form.model?.trim() || '',
    year: Number(form.year) || new Date().getFullYear(),
    color: form.color?.trim() || undefined,
    km: form.km ? Number(String(form.km).replace(/\D/g, '')) : undefined,
    vehicleSize: form.vehicleSize || 'medio',
    services: serviceIds,
    discount: Number(form.discount || 0),
    notes: form.notes?.trim() || undefined,
    internalNote: form.internalNote?.trim() || undefined,
    clientPreferredLanguage: form.clientPreferredLanguage || DEFAULT_CLIENT_LANGUAGE,
    ...(form.clientId ? { clientId: form.clientId } : {}),
    ...(linkedTaskDisplayId ? { linkedTaskDisplayId } : {}),
  }

  if (totalOverride != null && !Number.isNaN(totalOverride)) {
    body.totalOverride = totalOverride
  }

  return body
}

export async function createTaskFromQuote(quoteId) {
  const { data } = await api.post(`/quotes/${encodeURIComponent(quoteId)}/create-task`)
  return mapTaskFromApi(data)
}

export const QUOTE_TONE = {
  Pendente: 'warn',
  Enviado: 'gold',
  Aprovado: 'success',
  Rejeitado: 'danger',
  Expirado: 'muted',
}

export { STATUS_MAP, STATUS_MAP_REVERSE, SERVICES_LABELS }
