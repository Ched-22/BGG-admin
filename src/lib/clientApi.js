import api from './api';
import { DEFAULT_PHONE_COUNTRY_CODE } from './phoneCountries';
import { formatPhoneDisplay } from './phoneUtils';
import { DEFAULT_CLIENT_LANGUAGE } from './clientLanguage';

function formatAddressPart(value) {
  const trimmed = value?.trim();
  return trimmed || '—';
}

import { formatPlateDisplay } from './plateUtils';

function mapVehicleFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    plate: row.plate || '',
    plateDisplay: row.plateDisplay || formatPlateDisplay(row.plate || ''),
    brand: row.brand || '',
    model: row.model || '',
    year: row.year != null ? Number(row.year) : null,
    color: row.color || '',
  };
}

export function mapClientFromApi(row, stats = {}) {
  const created = row.createdAt ? new Date(row.createdAt) : new Date();
  const phoneCountryCode = row.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE;
  const phoneNationalNumber = row.phoneNationalNumber || '';
  return {
    id: row.id,
    name: row.name,
    email: row.email || '',
    phoneCountryCode,
    phoneNationalNumber,
    tel: formatPhoneDisplay(phoneCountryCode, phoneNationalNumber),
    endereco: {
      unidade: formatAddressPart(row.addressUnit),
      logradouro: formatAddressPart(row.street),
      cidade: formatAddressPart(row.city),
      estado: formatAddressPart(row.state),
      cep: formatAddressPart(row.zipCode),
    },
    tarefas: stats.tarefas ?? 0,
    ativas: stats.ativas ?? 0,
    totalGasto: stats.totalGasto ?? 0,
    ultima: stats.ultima ?? '—',
    status: row.status || 'Ativo',
    since: String(created.getFullYear()),
    notes: row.notes?.trim() || '',
    preferredLanguage: row.preferredLanguage || DEFAULT_CLIENT_LANGUAGE,
    vehicles: Array.isArray(row.vehicles)
      ? row.vehicles.map(mapVehicleFromApi).filter(Boolean)
      : [],
  };
}

export function mapClientToApi(form) {
  return {
    name: form.name?.trim() || '',
    phoneCountryCode: String(form.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE).replace(/\D/g, ''),
    phoneNationalNumber: String(form.phoneNationalNumber || '').replace(/\D/g, ''),
    email: form.email?.trim() || undefined,
    status: form.status || 'Ativo',
    addressUnit: form.unidade?.trim() || undefined,
    street: form.logradouro?.trim() || undefined,
    city: form.cidade?.trim() || undefined,
    state: form.estado?.trim() || undefined,
    zipCode: form.cep?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
    preferredLanguage: form.preferredLanguage || DEFAULT_CLIENT_LANGUAGE,
  };
}

export async function listClients(params = {}) {
  const { data } = await api.get('/clients', { params });
  if (Array.isArray(data)) {
    return {
      data,
      page: 1,
      limit: data.length,
      total: data.length,
      totalPages: 1,
      statusCounts: {},
    };
  }
  return {
    data: Array.isArray(data?.data) ? data.data : [],
    page: data?.page ?? 1,
    limit: data?.limit ?? 15,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    statusCounts: data?.statusCounts ?? {},
  };
}

function cleanAddressPart(value) {
  const trimmed = value?.trim();
  return trimmed && trimmed !== '—' ? trimmed : '';
}

export function mapClientToTaskPrefill(client) {
  const row = client.name ? client : mapClientFromApi(client);
  return {
    clienteExistente: true,
    clientId: row.id,
    cliente: row.name || '',
    clienteEmail: row.email || '',
    clienteTelCountryCode: row.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    clienteTelNationalNumber: row.phoneNationalNumber || '',
    unidade: cleanAddressPart(row.endereco?.unidade),
    logradouro: cleanAddressPart(row.endereco?.logradouro),
    cidade: cleanAddressPart(row.endereco?.cidade),
    estado: cleanAddressPart(row.endereco?.estado),
    cep: cleanAddressPart(row.endereco?.cep),
    clientePreferredLanguage: row.preferredLanguage || DEFAULT_CLIENT_LANGUAGE,
  };
}

export async function searchClients(query, searchBy = 'name') {
  const trimmed = query?.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const result = await listClients({ search: trimmed, limit: 50 });
  const clients = result.data.map((row) => mapClientFromApi(row));

  if (searchBy === 'phone') {
    const digits = trimmed.replace(/\D/g, '');
    return clients.filter((client) => {
      const phoneDigits = `${client.phoneCountryCode}${client.phoneNationalNumber}`;
      return phoneDigits.includes(digits) || client.tel.includes(trimmed);
    });
  }

  if (searchBy === 'email') {
    const term = trimmed.toLowerCase();
    return clients.filter((client) => (client.email || '').toLowerCase().includes(term));
  }

  const term = trimmed.toLowerCase();
  return clients.filter((client) => client.name.toLowerCase().includes(term));
}

export async function getClient(id) {
  const { data } = await api.get(`/clients/${encodeURIComponent(id)}`);
  return mapClientFromApi(data);
}

export async function createClient(body) {
  const { data } = await api.post('/clients', body);
  return data;
}

export async function updateClient(id, body) {
  const { data } = await api.patch(`/clients/${id}`, body);
  return data;
}

export async function deleteClient(id) {
  const { data } = await api.delete(`/clients/${id}`);
  return data;
}
