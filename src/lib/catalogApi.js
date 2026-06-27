import api from './api';
import { formatEUR } from './currency';

export function mapCatalogServiceFromApi(row) {
  const prices = row.prices || {};
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || '',
    durationMinutes: row.durationMinutes,
    serviceCategory: row.serviceCategory || 'EXTERIOR',
    active: row.active !== false,
    priceSmall: prices.priceSmall ?? 0,
    priceMedium: prices.priceMedium ?? 0,
    priceLarge: prices.priceLarge ?? 0,
    priceVersionId: prices.priceVersionId || null,
    effectiveFrom: prices.effectiveFrom || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    priceHistory: (row.priceHistory || []).map(mapPriceHistoryFromApi),
  };
}

function mapPriceHistoryFromApi(row) {
  return {
    priceVersionId: row.priceVersionId,
    priceSmall: row.priceSmall,
    priceMedium: row.priceMedium,
    priceLarge: row.priceLarge,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
  };
}

export function mapCatalogForOrcamento(rows) {
  return (rows || []).map((row) => ({
    id: row.code,
    apiId: row.id,
    name: row.name,
    desc: row.description || '',
    durationHours: (row.durationMinutes || 0) / 60,
    prices: {
      pequeno: row.priceSmall ?? row.prices?.priceSmall ?? 0,
      medio: row.priceMedium ?? row.prices?.priceMedium ?? 0,
      grande: row.priceLarge ?? row.prices?.priceLarge ?? 0,
    },
  }));
}

export function mapCatalogServicesFromApi(rows) {
  return (rows ?? []).map(mapCatalogServiceFromApi);
}

export function mapCatalogServiceToCreate(form) {
  return {
    code: form.code?.trim().toLowerCase(),
    name: form.name?.trim(),
    description: form.description?.trim() || undefined,
    durationMinutes: Number(form.durationMinutes),
    serviceCategory: form.serviceCategory || 'EXTERIOR',
    priceSmall: Number(form.priceSmall),
    priceMedium: Number(form.priceMedium),
    priceLarge: Number(form.priceLarge),
  };
}

export function mapCatalogServiceToUpdate(form) {
  const body = {};
  if (form.name != null) body.name = form.name.trim();
  if (form.description != null) body.description = form.description.trim() || '';
  if (form.durationMinutes != null) body.durationMinutes = Number(form.durationMinutes);
  if (form.serviceCategory != null) body.serviceCategory = form.serviceCategory;
  if (form.active != null) body.active = !!form.active;
  return body;
}

export function mapCatalogPricesToPublish(form) {
  return {
    priceSmall: Number(form.priceSmall),
    priceMedium: Number(form.priceMedium),
    priceLarge: Number(form.priceLarge),
  };
}

export function formatPriceTierLabel(size) {
  if (size === 'priceSmall') return 'Pequeno';
  if (size === 'priceLarge') return 'Grande';
  return 'Médio';
}

export function formatPriceRange(service) {
  return `${formatEUR(service.priceSmall)} / ${formatEUR(service.priceMedium)} / ${formatEUR(service.priceLarge)}`;
}

export async function listCatalogServices(params = {}) {
  const { data } = await api.get('/catalog/services', { params });
  return {
    data: mapCatalogServicesFromApi(data.data),
    total: data.total ?? data.data?.length ?? 0,
  };
}

export async function getCatalogService(id) {
  const { data } = await api.get(`/catalog/services/${id}`);
  return mapCatalogServiceFromApi(data);
}

export async function createCatalogService(form) {
  const { data } = await api.post('/catalog/services', mapCatalogServiceToCreate(form));
  return mapCatalogServiceFromApi(data);
}

export async function updateCatalogService(id, form) {
  const { data } = await api.patch(`/catalog/services/${id}`, mapCatalogServiceToUpdate(form));
  return mapCatalogServiceFromApi(data);
}

export async function publishCatalogServicePrices(id, form) {
  const { data } = await api.post(`/catalog/services/${id}/prices`, mapCatalogPricesToPublish(form));
  return mapCatalogServiceFromApi(data);
}

export async function deactivateCatalogService(id) {
  const { data } = await api.delete(`/catalog/services/${id}`);
  return mapCatalogServiceFromApi(data);
}

export async function fetchOrcamentoCatalog() {
  const { data } = await listCatalogServices();
  return mapCatalogForOrcamento(data);
}
