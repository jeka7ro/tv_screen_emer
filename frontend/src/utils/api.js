import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors and format Pydantic validation errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on the login page or if this IS the login request
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isOnLoginPage = window.location.pathname === '/login';
      if (!isLoginRequest && !isOnLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Extract readable error message from Pydantic detail if it's an array of objects
    if (error.response?.data?.detail && typeof error.response.data.detail !== 'string') {
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        // Example structure: [{type, loc, msg, input}, ...]
        const messages = detail.map(err => {
          if (err.msg) {
            const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : '';
            return field ? `${field}: ${err.msg}` : err.msg;
          }
          return JSON.stringify(err);
        });
        error.response.data.detail = messages.join(', ');
      } else {
        error.response.data.detail = JSON.stringify(detail);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
