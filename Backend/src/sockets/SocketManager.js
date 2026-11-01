import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { Room } from '../models/Room.js';
import { BoardElement } from '../models/BoardElement.js';

export const initializeSocketIO = (io) => {
  /**
   * Socket.IO Authentication Middleware
   * Verifies JWT on handshake. Rejects connection if token is missing or invalid.
   */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.user = decoded;
      socket.boardRoles = new Map();
      next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  // Track active users per board room: boardId -> Map(socketId, userInfo)
  const boardUsers = new Map();

  io.on('connection', (socket) => {
    /**
     * join_board event:
     * Validates access with Room.getUserRole in DB, setting socket-level role
     * rather than trusting client-supplied role.
     */
    socket.on('join_board', async (data, callback) => {
      try {
        const { boardId, userName, avatarColor } = data || {};
        if (!boardId) {
          if (callback) callback({ success: false, message: 'Board ID is required' });
          return;
        }

        let board = null;
        if (mongoose.isValidObjectId(boardId)) {
          board = await Room.findById(boardId);
        } else if (typeof boardId === 'string' && boardId.length === 6) {
          board = await Room.findOne({ roomCode: boardId.toUpperCase() });
        }

        if (!board) {
          if (callback) callback({ success: false, message: 'Board not found' });
          return;
        }

        const userId = socket.user?.id || socket.user?._id;
        const verifiedRole = board.getUserRole(userId);

        // Deny access if user has no permissions (e.g. non-member on private board)
        if (!verifiedRole) {
          if (callback) callback({ success: false, message: 'Access denied: insufficient board permissions' });
          return;
        }

        const bIdStr = board._id.toString();
        socket.currentBoardId = bIdStr;
        socket.userRole = verifiedRole;
        socket.boardRoles.set(bIdStr, verifiedRole);

        socket.join(bIdStr);

        const activeUser = {
          socketId: socket.id,
          id: userId,
          name: userName || socket.user.name || 'Collaborator',
          avatarColor: avatarColor || socket.user.avatarColor || '#7F1D3F',
          role: verifiedRole, // Server-enforced role, never spoofed
        };

        if (!boardUsers.has(bIdStr)) {
          boardUsers.set(bIdStr, new Map());
        }
        boardUsers.get(bIdStr).set(socket.id, activeUser);

        const allActive = Array.from(boardUsers.get(bIdStr).values());

        // Notify other collaborators
        socket.to(bIdStr).emit('user_joined', activeUser);
        socket.to(bIdStr).emit('active_users_changed', allActive);

        if (callback) {
          callback({
            success: true,
            board,
            activeUsers: allActive,
            currentUser: activeUser,
            userRole: verifiedRole,
          });
        }
      } catch (err) {
        console.error('Error in socket join_board:', err);
        if (callback) callback({ success: false, message: 'Internal error joining board' });
      }
    });

    /**
     * cursor_move event:
     * Broadcasts cursor position to peers.
     */
    socket.on('cursor_move', ({ boardId, x, y }) => {
      const bId = (boardId || socket.currentBoardId)?.toString();
      if (!bId) return;

      socket.to(bId).emit('cursor_moved', {
        socketId: socket.id,
        userId: socket.user?.id || socket.user?._id,
        userName: socket.user?.name || 'Collaborator',
        avatarColor: socket.user?.avatarColor || '#7F1D3F',
        x,
        y,
      });
    });

    /**
     * element_created event:
     * Enforces editor/owner role. Persists element in BoardElement collection and broadcasts.
     */
    socket.on('element_created', async (payload) => {
      try {
        const { boardId, element, elementId, type, data, zIndex } = payload || {};
        const bId = (boardId || socket.currentBoardId)?.toString();
        const role = socket.boardRoles?.get(bId) || socket.userRole;

        if (!role || role === 'viewer') {
          socket.emit('permission_denied', {
            message: 'View-only permissions: cannot create elements on canvas',
          });
          return;
        }

        const elId = element?.id || element?.elementId || elementId;
        const elType = element?.type || type || 'stroke';
        const elData = element?.data || data || element || {};
        const elZIndex = element?.zIndex !== undefined ? element.zIndex : (zIndex || 0);

        if (bId && elId) {
          await BoardElement.findOneAndUpdate(
            { boardId: bId, elementId: elId },
            {
              $set: {
                boardId: bId,
                elementId: elId,
                type: elType,
                data: elData,
                zIndex: elZIndex,
                lastModifiedBy: socket.user?.id || socket.user?._id,
                isDeleted: false,
              },
              $setOnInsert: {
                createdBy: socket.user?.id || socket.user?._id,
              },
            },
            { upsert: true, new: true }
          );
        }

        const broadcastElem = element || {
          id: elId,
          elementId: elId,
          type: elType,
          data: elData,
          zIndex: elZIndex,
        };
        socket.to(bId).emit('element_created', broadcastElem);
      } catch (err) {
        console.error('Error in socket element_created:', err);
      }
    });

    /**
     * element_updated event:
     * Enforces editor/owner role. Updates element in BoardElement collection and broadcasts.
     */
    socket.on('element_updated', async (payload) => {
      try {
        const { boardId, element, elementId, data, zIndex } = payload || {};
        const bId = (boardId || socket.currentBoardId)?.toString();
        const role = socket.boardRoles?.get(bId) || socket.userRole;

        if (!role || role === 'viewer') {
          socket.emit('permission_denied', {
            message: 'View-only permissions: cannot update elements on canvas',
          });
          return;
        }

        const elId = element?.id || element?.elementId || elementId;
        if (bId && elId) {
          await BoardElement.findOneAndUpdate(
            { boardId: bId, elementId: elId },
            {
              $set: {
                ...(element?.type ? { type: element.type } : {}),
                data: element?.data || data || element,
                zIndex: element?.zIndex !== undefined ? element.zIndex : (zIndex || 0),
                lastModifiedBy: socket.user?.id || socket.user?._id,
              },
            }
          );
        }

        const broadcastElem = element || { id: elId, elementId: elId, data, zIndex };
        socket.to(bId).emit('element_updated', broadcastElem);
      } catch (err) {
        console.error('Error in socket element_updated:', err);
      }
    });

    /**
     * element_deleted event:
     * Enforces editor/owner role. Soft-deletes element in BoardElement collection.
     */
    socket.on('element_deleted', async ({ boardId, elementId }) => {
      try {
        const bId = (boardId || socket.currentBoardId)?.toString();
        const role = socket.boardRoles?.get(bId) || socket.userRole;

        if (!role || role === 'viewer') {
          socket.emit('permission_denied', {
            message: 'View-only permissions: cannot delete elements on canvas',
          });
          return;
        }

        if (bId && elementId) {
          await BoardElement.findOneAndUpdate(
            { boardId: bId, elementId },
            {
              $set: {
                isDeleted: true,
                lastModifiedBy: socket.user?.id || socket.user?._id,
              },
            }
          );
        }

        socket.to(bId).emit('element_deleted', elementId);
      } catch (err) {
        console.error('Error in socket element_deleted:', err);
      }
    });

    /**
     * clear_board event:
     * Enforces editor/owner role. Soft-deletes all elements on board.
     */
    socket.on('clear_board', async ({ boardId }) => {
      try {
        const bId = (boardId || socket.currentBoardId)?.toString();
        const role = socket.boardRoles?.get(bId) || socket.userRole;

        if (!role || role === 'viewer') {
          socket.emit('permission_denied', {
            message: 'View-only permissions: cannot clear canvas',
          });
          return;
        }

        if (bId) {
          await BoardElement.updateMany(
            { boardId: bId },
            {
              $set: {
                isDeleted: true,
                lastModifiedBy: socket.user?.id || socket.user?._id,
              },
            }
          );
        }

        socket.to(bId).emit('board_cleared');
      } catch (err) {
        console.error('Error in socket clear_board:', err);
      }
    });

    /**
     * Leave / Disconnect cleanup
     */
    const handleLeave = (bId) => {
      const targetBoardId = (bId || socket.currentBoardId)?.toString();
      if (targetBoardId && boardUsers.has(targetBoardId)) {
        const room = boardUsers.get(targetBoardId);
        room.delete(socket.id);
        const remaining = Array.from(room.values());
        socket.to(targetBoardId).emit('user_left', {
          socketId: socket.id,
          userId: socket.user?.id || socket.user?._id,
        });
        socket.to(targetBoardId).emit('active_users_changed', remaining);
        if (room.size === 0) {
          boardUsers.delete(targetBoardId);
        }
      }
    };

    socket.on('leave_board', (data) => handleLeave(data?.boardId));
    socket.on('disconnect', () => handleLeave());
  });
};
