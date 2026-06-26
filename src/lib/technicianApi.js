import api from './api';

export async function listTechnicians(params = {}) {
  const { data } = await api.get('/users/technicians', { params });
  return data;
}

export async function getTechnician(id) {
  const { data } = await api.get(`/users/technicians/${id}`);
  return data;
}

export async function createTechnician(body) {
  const { data } = await api.post('/users/technicians', body);
  return data;
}

export async function updateTechnician(id, body) {
  const { data } = await api.patch(`/users/technicians/${id}`, body);
  return data;
}

export async function deactivateTechnician(id) {
  const { data } = await api.delete(`/users/technicians/${id}`);
  return data;
}

export function mapTechniciansForPicker(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((t) => t.active !== false)
    .map((t) => ({
      id: t.id,
      name: t.name,
      skills: Array.isArray(t.skills) ? t.skills : [],
      serviceIds: Array.isArray(t.serviceIds) ? t.serviceIds : [],
      serviceCodes: Array.isArray(t.serviceCodes) ? t.serviceCodes : [],
      services: Array.isArray(t.services) ? t.services : [],
      disponivel: t.available !== false,
      conflito: t.hasScheduleConflict === true,
      agenda: t.scheduleLabel || "—",
      carga: t.activeAppointmentsCount ?? 0,
    }));
}
