import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import { initializeSocketIO } from './sockets/SocketManager.js';
import authRoutes from './routes/authRoutes.js';
import boardRoutes from './routes/boardRoutes.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: true, // Allow frontend origin dynamically
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', name: 'Boardly API', message: 'Boardly Real-Time Collaboration Backend is running' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initializeSocketIO(io);

// Optional MongoDB Connection (falls back gracefully to high-performance in-memory store)
if (config.mongoUri) {
  mongoose
    .connect(config.mongoUri, { serverSelectionTimeoutMS: 2000 })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
      console.log('Notice: MongoDB not detected locally (', err.message, '). Running in zero-config memory mode.');
    });
}

// Start Server
const PORT = config.port || 5000;
server.listen(PORT, () => {
  console.log(`Boardly Backend Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO listening on port ${PORT}`);
});

export { app, server, io };
