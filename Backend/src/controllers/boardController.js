import mongoose from 'mongoose';
import { Room } from '../models/Room.js';
import { BoardElement } from '../models/BoardElement.js';

/**
 * Helper to normalize user ID from request
 */
const getUserId = (req) => {
  return req.user?.id || req.user?._id || null;
};

/**
 * POST /api/boards
 * createBoard: Takes title, grid, and default permission.
 * Generates the room code and sets the creator as immutable owner (FR-01).
 */
export const createBoard = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      title,
      grid,
      gridType,
      gridStyle,
      defaultPermission,
      defaultRole,
      backgroundColor,
      isPublic,
      template,
    } = req.body;

    const chosenGrid = gridType || grid || gridStyle || 'dots';
    const validGridType = ['dots', 'lines', 'cross', 'none'].includes(chosenGrid)
      ? chosenGrid
      : 'dots';

    const chosenRole = defaultRole || defaultPermission || 'editor';
    const validDefaultRole = ['editor', 'viewer'].includes(chosenRole)
      ? chosenRole
      : 'editor';

    const roomCode = await Room.generateUniqueRoomCode();

    const room = new Room({
      title: (title && title.trim()) || 'Untitled Whiteboard',
      roomCode,
      owner: userId,
      members: [],
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      defaultRole: validDefaultRole,
      backgroundColor: backgroundColor || '#ffffff',
      gridType: validGridType,
    });

    await room.save();
    await room.populate('owner', 'name email avatarColor');

    return res.status(201).json({
      success: true,
      board: room,
    });
  } catch (error) {
    console.error('Error in createBoard controller:', error);
    return res.status(500).json({ error: 'Failed to create whiteboard' });
  }
};

/**
 * GET /api/boards
 * getUserBoards: Returns boards the user owns vs. boards they joined,
 * with owner and members populated (dashboard tabs "My Whiteboards" and "Shared with Me", FR-10).
 */
export const getUserBoards = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const owned = await Room.find({ owner: userId })
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor')
      .sort({ updatedAt: -1 });

    const joined = await Room.find({
      'members.user': userId,
      owner: { $ne: userId },
    })
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor')
      .sort({ updatedAt: -1 });

    return res.json({
      success: true,
      owned,
      joined,
      boards: [...owned, ...joined],
    });
  } catch (error) {
    console.error('Error in getUserBoards controller:', error);
    return res.status(500).json({ error: 'Failed to retrieve boards' });
  }
};

/**
 * POST /api/boards/join
 * joinBoardByCode: Adds the user as a member with defaultRole on first join only (no duplicates).
 * Returns the boardId (FR-02, AC-01).
 */
export const joinBoardByCode = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to join board' });
    }

    const { code, roomCode } = req.body;
    const lookupCode = (code || roomCode)?.trim()?.toUpperCase();

    if (!lookupCode) {
      return res.status(400).json({ error: 'Room code is required' });
    }

    const board = await Room.findOne({ roomCode: lookupCode });
    if (!board) {
      return res.status(404).json({ error: 'Whiteboard not found with the provided code' });
    }

    const normalizedUserId = userId.toString();
    const normalizedOwnerId = board.owner.toString();

    // Owner is already superuser
    if (normalizedOwnerId === normalizedUserId) {
      return res.json({
        success: true,
        boardId: board._id,
        role: 'owner',
        board,
      });
    }

    // Check if user is already a member
    const existingMember = board.members.find(
      (m) => m.user.toString() === normalizedUserId
    );

    let assignedRole = board.defaultRole;

    if (!existingMember) {
      // Add member with defaultRole on first join only (no duplicates)
      board.members.push({
        user: userId,
        role: board.defaultRole,
        joinedAt: new Date(),
      });
      await board.save();
    } else {
      assignedRole = existingMember.role;
    }

    await board.populate('owner', 'name email avatarColor');
    await board.populate('members.user', 'name email avatarColor');

    return res.json({
      success: true,
      boardId: board._id,
      role: assignedRole,
      board,
    });
  } catch (error) {
    console.error('Error in joinBoardByCode controller:', error);
    return res.status(500).json({ error: 'Failed to join whiteboard' });
  }
};

/**
 * GET /api/boards/:id or GET /api/boards/code/:code
 * getBoardDetails: Hydration: returns the board plus BoardElement.find({ boardId, isDeleted:false })
 * sorted by zIndex, then createdAt (FR-08, AC-05).
 */
export const getBoardDetails = async (req, res) => {
  try {
    let board = req.board;

    if (!board) {
      const { id, code, roomCode } = req.params;
      const lookupCode = code || roomCode;

      if (lookupCode) {
        board = await Room.findOne({ roomCode: lookupCode.toUpperCase() });
      } else if (id) {
        if (mongoose.isValidObjectId(id)) {
          board = await Room.findById(id);
        } else if (typeof id === 'string' && id.length === 6) {
          board = await Room.findOne({ roomCode: id.toUpperCase() });
        }
      }

      if (!board) {
        return res.status(404).json({ error: 'Whiteboard not found' });
      }

      const userId = getUserId(req);
      const userRole = board.getUserRole(userId);
      if (!userRole) {
        return res.status(403).json({ error: 'Access denied: insufficient board permissions' });
      }
      req.userRole = userRole;
    }

    // Populate owner and members if needed
    if (!board.populated('owner')) {
      await board.populate('owner', 'name email avatarColor');
    }
    if (!board.populated('members.user')) {
      await board.populate('members.user', 'name email avatarColor');
    }

    // Elements hydration sorted by zIndex asc, then createdAt asc
    const elements = await BoardElement.find({
      boardId: board._id,
      isDeleted: false,
    }).sort({ zIndex: 1, createdAt: 1 });

    return res.json({
      success: true,
      board,
      elements,
      userRole: req.userRole || board.getUserRole(getUserId(req)),
    });
  } catch (error) {
    console.error('Error in getBoardDetails controller:', error);
    return res.status(500).json({ error: 'Failed to load whiteboard details' });
  }
};

/**
 * PATCH /api/boards/:id/members
 * updateMemberRole: Owner only. Changes a member's editor/viewer role (FR-03).
 */
export const updateMemberRole = async (req, res) => {
  try {
    const board = req.board || (await Room.findById(req.params.id));
    if (!board) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    const currentUserId = getUserId(req);
    const normalizedOwnerId = board.owner?._id
      ? board.owner._id.toString()
      : board.owner?.toString();

    if (!currentUserId || normalizedOwnerId !== currentUserId.toString()) {
      return res.status(403).json({ error: 'Access denied: owner permissions required' });
    }

    const { memberId, userId, role } = req.body;
    const targetUserId = (memberId || userId)?.toString();

    if (!targetUserId) {
      return res.status(400).json({ error: 'Member user ID is required' });
    }

    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "editor" or "viewer"' });
    }

    const member = board.members.find(
      (m) => (m.user?._id ? m.user._id.toString() : m.user?.toString()) === targetUserId
    );

    if (!member) {
      return res.status(404).json({ error: 'Member not found on this whiteboard' });
    }

    member.role = role;
    await board.save();
    await board.populate('members.user', 'name email avatarColor');

    return res.json({
      success: true,
      board,
      updatedMember: member,
    });
  } catch (error) {
    console.error('Error in updateMemberRole controller:', error);
    return res.status(500).json({ error: 'Failed to update member role' });
  }
};

/**
 * PATCH /api/boards/:id
 * updateBoardSettings: Owner/Editor. Updates title, background colour, and grid type.
 */
export const updateBoardSettings = async (req, res) => {
  try {
    const board = req.board || (await Room.findById(req.params.id));
    if (!board) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    const {
      title,
      backgroundColor,
      gridType,
      gridStyle,
      isPublic,
      defaultRole,
    } = req.body;

    if (title !== undefined && typeof title === 'string') {
      board.title = title.trim() || board.title;
    }

    if (backgroundColor !== undefined && typeof backgroundColor === 'string') {
      board.backgroundColor = backgroundColor;
    }

    const chosenGrid = gridType || gridStyle;
    if (chosenGrid && ['dots', 'lines', 'cross', 'none'].includes(chosenGrid)) {
      board.gridType = chosenGrid;
    }

    if (isPublic !== undefined) {
      board.isPublic = Boolean(isPublic);
    }

    if (defaultRole && ['editor', 'viewer'].includes(defaultRole)) {
      board.defaultRole = defaultRole;
    }

    await board.save();
    await board.populate('owner', 'name email avatarColor');

    return res.json({
      success: true,
      board,
    });
  } catch (error) {
    console.error('Error in updateBoardSettings controller:', error);
    return res.status(500).json({ error: 'Failed to update board settings' });
  }
};

/**
 * DELETE /api/boards/:id
 * deleteBoard: Owner only. Deletes the room and also deleteMany its elements.
 */
export const deleteBoard = async (req, res) => {
  try {
    const board = req.board || (await Room.findById(req.params.id));
    if (!board) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    const currentUserId = getUserId(req);
    const normalizedOwnerId = board.owner?._id
      ? board.owner._id.toString()
      : board.owner?.toString();

    if (!currentUserId || normalizedOwnerId !== currentUserId.toString()) {
      return res.status(403).json({ error: 'Access denied: owner permissions required' });
    }

    // Cascade delete all elements associated with this room
    await BoardElement.deleteMany({ boardId: board._id });

    // Delete the room document
    await Room.findByIdAndDelete(board._id);

    return res.json({
      success: true,
      message: 'Board and elements successfully deleted',
      boardId: board._id,
    });
  } catch (error) {
    console.error('Error in deleteBoard controller:', error);
    return res.status(500).json({ error: 'Failed to delete whiteboard' });
  }
};

export default {
  createBoard,
  getUserBoards,
  joinBoardByCode,
  getBoardDetails,
  updateMemberRole,
  updateBoardSettings,
  deleteBoard,
};
