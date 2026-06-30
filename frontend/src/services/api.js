import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api'),
  withCredentials: true,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicmind_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const firebaseLogin = (data) => API.post('/auth/firebase', data);
export const getMe = () => API.get('/auth/me');

// Issues
export const getIssues = (params) => API.get('/issues', { params });
export const getIssue = (id) => API.get(`/issues/${id}`);
export const createIssue = (formData) => API.post('/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const verifyIssue = (id, data) => API.post(`/issues/${id}/verify`, data);
export const upvoteIssue = (id) => API.post(`/issues/${id}/upvote`);
export const resolveIssue = (id, formData) => API.put(`/issues/${id}/resolve`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getAuthorityIssues = () => API.get('/issues/authority');
export const confirmResolution = (id, vote) => API.post(`/issues/${id}/community-confirm`, { vote });

// AI
export const chatWithAI = (message) => API.post('/ai/chat', { message });
export const getAnalytics = () => API.get('/ai/analytics');
export const getPredictions = () => API.get('/ai/predictions');

// Users / Gamification
export const getLeaderboard = () => API.get('/users/leaderboard');
export const getRecommendations = () => API.get('/users/recommendations');

// Notifications
export const getNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');

export default API;
