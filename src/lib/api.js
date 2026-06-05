import axios from 'axios';
<<<<<<< HEAD
import { getToken, handleUnauthorized } from './auth';
=======
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
<<<<<<< HEAD
  const token = getToken();
=======
  const token = localStorage.getItem('bgg-token');
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
<<<<<<< HEAD
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
=======
      localStorage.removeItem('bgg-token');
      localStorage.removeItem('bgg-user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43
