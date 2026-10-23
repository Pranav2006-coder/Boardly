import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Middleware to enforce authentication via JWT Bearer token
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to optionally authenticate if Bearer token is provided
 */
export const authenticateOptional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, config.jwtSecret);
    } catch {
      // Invalid token, continue as unauthenticated guest
    }
  }
  next();
};

export default {
  requireAuth,
  authenticateOptional,
};
