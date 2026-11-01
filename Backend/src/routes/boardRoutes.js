import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  requireBoardAccess,
  requireEditorOrOwner,
  requireOwnerOnly,
} from '../middleware/acl.js';
import {
  createBoard,
  getUserBoards,
  joinBoardByCode,
  getBoardDetails,
  updateMemberRole,
  updateBoardSettings,
  addCollaborator,
  syncElements,
  deleteBoard,
} from '../controllers/boardController.js';

const router = express.Router();

// ── All board routes require authentication ──────────────────────────────────

// GET  /api/boards        — list owned & joined boards (FR-10)
router.get('/', requireAuth, getUserBoards);

// POST /api/boards        — create a new board (FR-01)
router.post('/', requireAuth, createBoard);

// POST /api/boards/join   — join by room code (FR-02, AC-01)
// ⚠️  Registered BEFORE /:id so "join" isn't treated as an ObjectId
router.post('/join', requireAuth, joinBoardByCode);

// GET  /api/boards/code/:code & GET /api/boards/room/:code — hydrate board by room code (?room= / ?join= links)
// ⚠️  Registered BEFORE /:id so "code" and "room" aren't treated as ObjectIds
router.get('/code/:code', requireAuth, requireBoardAccess, getBoardDetails);
router.get('/room/:code', requireAuth, requireBoardAccess, getBoardDetails);

// GET  /api/boards/:id    — hydrate board + elements by Mongo ID (FR-08, AC-05)
router.get('/:id', requireAuth, requireBoardAccess, getBoardDetails);

// POST /api/boards/:id/collaborators — invite/add collaborator by email
router.post('/:id/collaborators', requireAuth, requireBoardAccess, requireEditorOrOwner, addCollaborator);

// POST /api/boards/:id/elements — sync / bulk upsert elements
router.post('/:id/elements', requireAuth, requireBoardAccess, requireEditorOrOwner, syncElements);

// PATCH /api/boards/:id/members  — change a member's role (FR-03, owner only)
// ⚠️  Registered BEFORE PATCH /:id so "/members" suffix doesn't collide
router.patch('/:id/members', requireAuth, requireBoardAccess, requireOwnerOnly, updateMemberRole);

// PATCH or PUT /api/boards/:id   — update title / background / grid / star (owner or editor)
router.patch('/:id', requireAuth, requireBoardAccess, requireEditorOrOwner, updateBoardSettings);
router.put('/:id', requireAuth, requireBoardAccess, requireEditorOrOwner, updateBoardSettings);

// DELETE /api/boards/:id  — delete board + cascade elements (owner only)
router.delete('/:id', requireAuth, requireBoardAccess, requireOwnerOnly, deleteBoard);

export default router;
