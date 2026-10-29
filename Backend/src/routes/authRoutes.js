import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

const router = express.Router();

/**
 * Build a signed JWT from a Mongoose User document.
 * The payload uses `id` (string) so middleware can do req.user.id uniformly.
 */
function createToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function safeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'Account with this email already exists' });
    }

    const colors = ['#0f766e', '#04b4a2', '#007199', '#7c3aed', '#db2777', '#ea580c'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const user = await User.create({ name, email, password, avatarColor });
    const token = createToken(user);

    return res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('Error in /register:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user);
    return res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('Error in /login:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });
    return res.json({ user: safeUser(user) });
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }
});

export default router;
