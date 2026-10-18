import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const initializeSocketIO = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      socket.user = jwt.verify(token, config.jwtSecret); // {id, name, avatarColor}
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });
  io.on('connection', (socket) => { /* register handlers as before */ });
};