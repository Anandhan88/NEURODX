import axios from 'axios';

// Default Render production URL fallback if process.env.REACT_APP_API_URL is not set
const DEFAULT_BACKEND_URL = 'https://neurodx-001b.onrender.com';
const rawUrl = process.env.REACT_APP_API_URL || DEFAULT_BACKEND_URL;
const API_BASE_URL = rawUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout to handle Render free tier cold-starts
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
