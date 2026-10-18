import { Room } from '../../models/Room.js';

const room = await Room.findById(boardId);
const serverRole = room?.getUserRole(socket.user.id);
if (!serverRole) return ack?.({ success: false, error: 'Access denied' });

socket.userId = socket.user.id;
socket.userName = socket.user.name;
socket.avatarColor = socket.user.avatarColor;
socket.userRole = serverRole;