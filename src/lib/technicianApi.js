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
