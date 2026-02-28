import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (email, password, age, gender, name) =>
    api.post('/auth/register', { email, password, age, gender, name }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
};

export const postsService = {
  getPosts: (sortBy = 'recommendation', userLat, userLng) =>
    api.get('/posts', { params: { sortBy, userLat, userLng } }),
  createPost: (userId, startLat, startLng, endLat, endLng, destination, mode) =>
    api.post('/posts', { userId, startLat, startLng, endLat, endLng, destination, mode }),
  deletePost: (postId) =>
    api.delete(`/posts/${postId}`),
};

export const messagesService = {
  getChatHistory: (userId, otherUserId) =>
    api.get(`/messages/chat/${userId}/${otherUserId}`),
  getConversations: (userId) =>
    api.get(`/messages/conversations/${userId}`),
  sendMessage: (senderId, recipientId, content) =>
    api.post('/messages', { senderId, recipientId, content }),
  archiveChat: (userId, otherUserId) =>
    api.post(`/messages/archive/${userId}/${otherUserId}`),
};

export const usersService = {
  getUser: (userId) =>
    api.get(`/users/${userId}`),
  updateStatus: (userId, isOnline) =>
    api.put(`/users/${userId}/status`, { isOnline }),
};

export const recommendationsService = {
  getPersonalized: (userId, userLocation, userDestination) =>
    api.post('/recommendations/personalized', { userId, userLocation, userDestination }),
};

export default api;
