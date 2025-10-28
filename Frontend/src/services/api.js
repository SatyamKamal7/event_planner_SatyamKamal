import axios from 'axios';


const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const authAPI = axios.create({
  baseURL: `${BASE_URL}/auth`,
});

export const eventsAPI = axios.create({
  baseURL: `${BASE_URL}/events`,
});

export const rsvpAPI = axios.create({
  baseURL: `${BASE_URL}/rsvps`,
});

// Add token to requests
eventsAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

rsvpAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});