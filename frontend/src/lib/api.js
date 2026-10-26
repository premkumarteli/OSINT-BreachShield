import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || (typeof window !== 'undefined' && window.location?.hostname ? `http://${window.location.hostname}:5000` : 'http://localhost:5000');

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('osint_token');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;

