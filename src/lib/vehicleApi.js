import api from './api';
import { formatPlateDisplay } from './plateUtils';

export function mapVehicleFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    plate: row.plate || '',
    plateCountry: row.plateCountry || 'ES',
    plateDisplay: row.plateDisplay || formatPlateDisplay(row.plate || '', row.plateCountry),
    brand: row.brand || '',
    model: row.model || '',
    year: row.year != null ? Number(row.year) : new Date().getFullYear(),
    color: row.color || '',
    clientId: row.clientId,
    clientName: row.clientName || '',
    clientPhoneCountryCode: row.clientPhoneCountryCode || '',
    clientPhoneNationalNumber: row.clientPhoneNationalNumber || '',
  };
}

export function mapVehicleToApi(form) {
  return {
    plate: form.plate?.trim() || '',
    plateCountry: form.plateCountry || 'ES',
    brand: form.brand?.trim() || '',
    model: form.model?.trim() || '',
    year: Number(form.year) || new Date().getFullYear(),
    color: form.color?.trim() || undefined,
    clientId: form.clientId,
  };
}

export async function listVehicles(params = {}) {
  const { data } = await api.get('/vehicles', { params });
  return {
    data: (data?.data || []).map(mapVehicleFromApi),
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
  };
}

export async function listVehiclesByClient(clientId) {
  const { data } = await api.get(`/vehicles/client/${encodeURIComponent(clientId)}`);
  return Array.isArray(data) ? data.map(mapVehicleFromApi) : [];
}

export async function createVehicle(body) {
  const { data } = await api.post('/vehicles', body);
  return mapVehicleFromApi(data);
}

export async function updateVehicle(id, body) {
  const { data } = await api.patch(`/vehicles/${encodeURIComponent(id)}`, body);
  return mapVehicleFromApi(data);
}

export async function deleteVehicle(id) {
  const { data } = await api.delete(`/vehicles/${encodeURIComponent(id)}`);
  return data;
}
