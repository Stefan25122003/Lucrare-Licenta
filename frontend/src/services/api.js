import axios from 'axios';

// Configurare centralizată axios
const API = axios.create({
  baseURL: 'http://localhost:5000', // Fără /api
  headers: {
    'Content-Type': 'application/json'
  }
});

// Adăugare interceptor pentru token de autentificare
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default API;