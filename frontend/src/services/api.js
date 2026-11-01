import axios from 'axios';

// When running through Vite in development, requests to /api are proxied to http://localhost:5000/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
    // If backend demo route exists, use it, otherwise login as demo user
    try {
      const res = await api.post('/auth/demo', { role });
      return res.data;
    } catch {
      // Fallback: register or login with demo email
      const demoEmail = `${role.toLowerCase()}@boardly.app`;
      try {
        const loginRes = await api.post('/auth/login', { email: demoEmail, password: 'demo_password_123' });
        return loginRes.data;
      } catch {
        const regRes = await api.post('/auth/register', {
          name: role === 'sarah' ? 'Sarah Chen' : 'Alex Morgan',
          email: demoEmail,
          password: 'demo_password_123',
        });
        return regRes.data;
      }
    }
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const boardApi = {
  getBoards: async () => {
    const res = await api.get('/boards');
    // Backend returns { success: true, owned: [...], joined: [...], boards: [...] }
    return res.data.boards || [...(res.data.owned || []), ...(res.data.joined || [])];
  },
  getBoard: async (id) => {
    const res = await api.get(`/boards/${id}`);
    const board = res.data.board;
    if (board) {
      if (res.data.elements) board.elements = res.data.elements;
      if (res.data.userRole) board.role = res.data.userRole;
    }
    return board;
  },
  getBoardByRoomCode: async (roomCode) => {
    const norm = (roomCode || '').replace(/[\s-]/g, '').toUpperCase();
    const res = await api.get(`/boards/code/${norm}`);
    const board = res.data.board;
    if (board) {
      if (res.data.elements) board.elements = res.data.elements;
      if (res.data.userRole) board.role = res.data.userRole;
    }
    return board;
  },
  joinBoard: async (code) => {
    const norm = (code || '').replace(/[\s-]/g, '').toUpperCase();
    const res = await api.post('/boards/join', { code: norm });
    return res.data;
  },
  createBoard: async (data) => {
    const res = await api.post('/boards', data);
    return res.data.board;
  },
  updateBoard: async (id, data) => {
    // Both PATCH and PUT supported on backend
    const res = await api.patch(`/boards/${id}`, data);
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
