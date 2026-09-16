import api from './api';
import {
  canAccessAdmin,
  isAdminUser,
  isTechnicianUser,
} from './permissions';

export { canAccessAdmin, isAdminUser, isTechnicianUser };

export async function registerAccount(body) {
  const { data } = await api.post('/auth/register', body);
  return data;
}

export async function loginWithGoogle(idToken) {
  const { data } = await api.post('/auth/google', { idToken });
  return data;
}

export async function requestPasswordReset(email) {
  const { data } = await api.post('/auth/forgot-password', {
    email,
    client: 'admin',
  });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data;
}
