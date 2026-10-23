import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('boardly_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },
  demo: async (role = 'alex') => {
    const res = await api.post('/auth/demo', { role });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const boardApi = {
  getBoards: async () => {
    const res = await api.get('/boards');
    return res.data.boards;
  },
  getBoard: async (id) => {
    const res = await api.get(`/boards/${id}`);
    return res.data.board;
  },
  getBoardByRoomCode: async (roomCode) => {
    const res = await api.get(`/boards/room/${roomCode}`);
    return res.data.board;
  },
  createBoard: async (data) => {
    const res = await api.post('/boards', data);
    return res.data.board;
  },
  updateBoard: async (id, data) => {
    const res = await api.put(`/boards/${id}`, data);
    return res.data.board;
  },
  deleteBoard: async (id) => {
    const res = await api.delete(`/boards/${id}`);
    return res.data;
  },
  addCollaborator: async (id, email, role) => {
    const res = await api.post(`/boards/${id}/collaborators`, { email, role });
    return res.data.board;
  },
  syncElements: async (id, elements) => {
    const res = await api.post(`/boards/${id}/elements`, { elements });
    return res.data.elements;
  },
};

export default api;
