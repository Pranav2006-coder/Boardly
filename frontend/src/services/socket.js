import { io } from 'socket.io-client';

// In development, the Vite server proxies /socket.io to http://localhost:5000
const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      auth: (cb) => cb({ token: localStorage.getItem('boardly_token') }),
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
