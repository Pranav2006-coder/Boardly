import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Room } from '../models/Room.js';
import { config } from '../config/env.js';

/**
 * Extracts authenticated user from token if req.user is not already populated.
 */
const resolveUser = (req) => {
  if (req.user) return req.user;
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, config.jwtSecret);
      return req.user;
    } catch {
      // Invalid/expired token - continue as unauthenticated guest
    }
  }
  return null;
};

/**
 * requireBoardAccess
 * - Finds the board by :id or :code.
 * - Calls getUserRole(userId).
 * - Attaches req.board and req.userRole.
 * - Returns 404 if the board is missing and 403 if the role is null.
 */
export const requireBoardAccess = async (req, res, next) => {
  try {
    const { id, code, roomCode } = req.params;
    const lookupCode = code || roomCode;

    let board = null;

    if (lookupCode) {
      board = await Room.findOne({ roomCode: lookupCode.toUpperCase() });
    } else if (id) {
      if (mongoose.isValidObjectId(id)) {
        board = await Room.findById(id);
      }
      // Fallback in case a 6-character roomCode was passed into :id
      if (!board && typeof id === 'string' && id.length === 6) {
        board = await Room.findOne({ roomCode: id.toUpperCase() });
      }
    }

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const user = resolveUser(req);
    const userId = user?.id || user?._id;
    const role = board.getUserRole(userId);

    if (!role) {
      return res.status(403).json({ error: 'Access denied: insufficient board permissions' });
    }

    req.board = board;
    req.userRole = role;
    next();
  } catch (error) {
    console.error('Error in requireBoardAccess middleware:', error);
    return res.status(500).json({ error: 'Internal server error verifying board permissions' });
  }
};

/**
 * requireEditorOrOwner
 * Returns 403 if the role is viewer (or undefined).
 */
export const requireEditorOrOwner = (req, res, next) => {
  if (!req.userRole || req.userRole === 'viewer') {
    return res.status(403).json({ error: 'Access denied: editor or owner permissions required' });
  }
  next();
};

/**
 * requireOwnerOnly
 * Returns 403 unless the role is owner.
 */
export const requireOwnerOnly = (req, res, next) => {
  if (req.userRole !== 'owner') {
    return res.status(403).json({ error: 'Access denied: owner permissions required' });
  }
  next();
};

export default {
  requireBoardAccess,
  requireEditorOrOwner,
  requireOwnerOnly,
};
