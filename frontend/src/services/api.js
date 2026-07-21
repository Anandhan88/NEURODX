import axios from 'axios';

// Base URL configured for production Vercel deployment & local development
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure global axios defaults as fallback
axios.defaults.baseURL = API_BASE_URL;

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Request Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

export { API_BASE_URL };
export default api;
