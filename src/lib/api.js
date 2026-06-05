import axios from 'axios';
import { getToken, handleUnauthorized } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const isLoginRequest = url.includes('/auth/login');
      if (!isLoginRequest) {
        handleUnauthorized('expired');
      }
    }
    return Promise.reject(err);
  },
);

export default api;
