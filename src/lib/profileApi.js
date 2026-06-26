import api from './api';

export async function getMyProfile() {
  const { data } = await api.get('/users/me');
  return data;
}

export async function updateMyProfile(body) {
  const { data } = await api.patch('/users/me', body);
  return data;
}
