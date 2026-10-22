import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { getBoardById } from '../store/dataStore.js';

export const initializeSocketIO = (io) => {
  // Authentication middleware (permits authenticated users as well as guest viewers)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        socket.user = jwt.verify(token, config.jwtSecret);
      } else {
        socket.user = {
          id: `guest_${socket.id.slice(0, 6)}`,
          name: 'Guest Collaborator',
          avatarColor: '#889391',
          role: 'viewer'
        };
      }
      next();
    } catch {
      socket.user = {
        id: `guest_${socket.id.slice(0, 6)}`,
        name: 'Guest Collaborator',
        avatarColor: '#889391',
        role: 'viewer'
      };
      next();
    }
  });

  // Track active users per board room
  const boardUsers = new Map(); // boardId -> Map(socketId, userInfo)

  io.on('connection', (socket) => {
    let currentBoardId = null;

    socket.on('join_board', ({ boardId, role, userName, avatarColor }, callback) => {
      currentBoardId = boardId;
      socket.join(boardId);

      const board = getBoardById(boardId);
      const isMember = board && board.collaborators?.some(c => c.id === socket.user.id);
      
      const effectiveRole = role || (isMember ? 'editor' : (board?.isPublic ? 'editor' : 'viewer'));
      const activeUser = {
        socketId: socket.id,
        id: socket.user.id,
        name: userName || socket.user.name || 'Anonymous Collaborator',
        avatarColor: avatarColor || socket.user.avatarColor || '#0f766e',
        role: effectiveRole
      };

      if (!boardUsers.has(boardId)) {
        boardUsers.set(boardId, new Map());
      }
      boardUsers.get(boardId).set(socket.id, activeUser);

      const allActive = Array.from(boardUsers.get(boardId).values());

      // Notify others in board room
      socket.to(boardId).emit('user_joined', activeUser);
      socket.to(boardId).emit('active_users_changed', allActive);

      if (callback) {
        callback({
          success: true,
          board,
          activeUsers: allActive,
          currentUser: activeUser
        });
      }
    });

    socket.on('cursor_move', ({ boardId, x, y }) => {
      if (!boardId) return;
      socket.to(boardId).emit('cursor_moved', {
        socketId: socket.id,
        userId: socket.user.id,
        userName: socket.user.name,
        avatarColor: socket.user.avatarColor,
        x,
        y
      });
    });

    socket.on('element_created', ({ boardId, element }) => {
      if (!boardId || !element) return;
      const board = getBoardById(boardId);
      if (board) {
        board.elements = board.elements || [];
        const idx = board.elements.findIndex(e => e.id === element.id);
        if (idx >= 0) {
          board.elements[idx] = element;
        } else {
          board.elements.push(element);
        }
        board.updatedAt = new Date().toISOString();
      }
      socket.to(boardId).emit('element_created', element);
    });

    socket.on('element_updated', ({ boardId, element }) => {
      if (!boardId || !element) return;
      const board = getBoardById(boardId);
      if (board && board.elements) {
        const idx = board.elements.findIndex(e => e.id === element.id);
        if (idx !== -1) {
          board.elements[idx] = { ...board.elements[idx], ...element };
          board.updatedAt = new Date().toISOString();
        }
      }
      socket.to(boardId).emit('element_updated', element);
    });

    socket.on('element_deleted', ({ boardId, elementId }) => {
      if (!boardId || !elementId) return;
      const board = getBoardById(boardId);
      if (board && board.elements) {
        board.elements = board.elements.filter(e => e.id !== elementId);
        board.updatedAt = new Date().toISOString();
      }
      socket.to(boardId).emit('element_deleted', elementId);
    });

    socket.on('clear_board', ({ boardId }) => {
      if (!boardId) return;
      const board = getBoardById(boardId);
      if (board) {
        board.elements = [];
        board.updatedAt = new Date().toISOString();
      }
      socket.to(boardId).emit('board_cleared');
    });

    const handleLeave = () => {
      if (currentBoardId && boardUsers.has(currentBoardId)) {
        const room = boardUsers.get(currentBoardId);
        room.delete(socket.id);
        const remaining = Array.from(room.values());
        socket.to(currentBoardId).emit('user_left', { socketId: socket.id, userId: socket.user.id });
        socket.to(currentBoardId).emit('active_users_changed', remaining);
        if (room.size === 0) {
          boardUsers.delete(currentBoardId);
        }
      }
    };

    socket.on('leave_board', handleLeave);
    socket.on('disconnect', handleLeave);
  });
};