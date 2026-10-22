import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { findUserByEmail, findUserById, createUser, memoryStore } from '../store/dataStore.js';

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, avatarColor: user.avatarColor, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials or user not found' });
  }

  const token = createToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role
    }
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Account with this email already exists' });
  }

  // Pick an aesthetic avatar color from design system
  const colors = ['#0f766e', '#04b4a2', '#007199', '#7c3aed', '#db2777', '#ea580c'];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  const user = createUser({
    name,
    email,
    passwordHash: password || 'default',
    avatarColor
  });

  const token = createToken(user);
  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role
    }
  });
});

// POST /api/auth/demo
router.post('/demo', (req, res) => {
  const { role = 'alex' } = req.body;
  const user = memoryStore.users.find(u => u.name.toLowerCase().includes(role.toLowerCase())) || memoryStore.users[0];
  const token = createToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role
    }
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = findUserById(decoded.id) || decoded;
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Session expired or invalid token' });
  }
});

export default router;
