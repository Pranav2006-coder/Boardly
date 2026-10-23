import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { 
  getBoardsForUser, 
  getBoardById, 
  getBoardByRoomCode, 
  createBoard, 
  memoryStore,
  findUserByEmail 
} from '../store/dataStore.js';

const router = express.Router();

// Middleware to authenticate user if token present
function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], config.jwtSecret);
    } catch {
      // invalid token, continue as guest
    }
  }
  next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// GET /api/boards
router.get('/', authenticateOptional, (req, res) => {
  const userId = req.user?.id || 'usr_alex';
  const boards = getBoardsForUser(userId);
  res.json({ boards });
});

// GET /api/boards/room/:roomCode
router.get('/room/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const board = getBoardByRoomCode(roomCode);
  if (!board) {
    return res.status(404).json({ error: 'Board not found for room code: ' + roomCode });
  }
  res.json({ board });
});

// GET /api/boards/:id
router.get('/:id', authenticateOptional, (req, res) => {
  const board = getBoardById(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }
  res.json({ board });
});

// POST /api/boards
router.post('/', requireAuth, (req, res) => {
  const { title, description, isPublic, gridStyle, template } = req.body;
  const board = createBoard({
    title,
    description,
    isPublic: isPublic !== false,
    gridStyle: gridStyle || 'dots',
    template: template || 'blank',
    user: req.user
  });
  res.status(201).json({ board });
});

// PUT /api/boards/:id
router.put('/:id', requireAuth, (req, res) => {
  const board = getBoardById(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  const { title, description, isStarred, gridStyle, isPublic } = req.body;
  if (title !== undefined) board.title = title;
  if (description !== undefined) board.description = description;
  if (isStarred !== undefined) board.isStarred = isStarred;
  if (gridStyle !== undefined) board.gridStyle = gridStyle;
  if (isPublic !== undefined) board.isPublic = isPublic;
  board.updatedAt = new Date().toISOString();

  res.json({ board });
});

// DELETE /api/boards/:id
router.delete('/:id', requireAuth, (req, res) => {
  const index = memoryStore.boards.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Board not found' });
  }
  const deleted = memoryStore.boards.splice(index, 1);
  res.json({ success: true, deleted: deleted[0] });
});

// POST /api/boards/:id/collaborators
router.post('/:id/collaborators', requireAuth, (req, res) => {
  const board = getBoardById(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  const { email, role = 'editor' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const targetUser = findUserByEmail(email) || {
    id: `usr_ext_${Date.now()}`,
    name: email.split('@')[0],
    email,
    avatarColor: '#04b4a2'
  };

  const existing = board.collaborators.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    existing.role = role;
  } else {
    board.collaborators.push({
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      avatarColor: targetUser.avatarColor,
      role
    });
  }

  res.json({ board });
});

// POST /api/boards/:id/elements
router.post('/:id/elements', requireAuth, (req, res) => {
  const board = getBoardById(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  const { elements } = req.body;
  if (Array.isArray(elements)) {
    board.elements = elements;
    board.updatedAt = new Date().toISOString();
  }

  res.json({ elements: board.elements });
});

export default router;
