# Boardly — Backend API & Real-Time Server

> Express + Socket.IO + MongoDB backend for the Boardly collaborative whiteboard platform.

---

## Table of Contents

1. [Setup & Prerequisites](#1-setup--prerequisites)
2. [Environment Variables](#2-environment-variables)
3. [Running the Server](#3-running-the-server)
4. [Running Tests](#4-running-tests)
5. [REST API Reference](#5-rest-api-reference)
6. [Socket.IO Events](#6-socketio-events)
7. [Requirement Traceability](#7-requirement-traceability)
8. [Project Structure](#8-project-structure)

---

## 1. Setup & Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18 (ESM + `fetch` built-in) |
| MongoDB | ≥ 6 locally **or** any Atlas URI |
| npm | ≥ 9 |

```bash
# Clone and install
cd Boardly/Backend
npm install
```

> **No MongoDB?** — `npm test` spins up its own in-memory MongoDB automatically via `mongodb-memory-server`. You don't need MongoDB installed to run tests.

---

## 2. Environment Variables

Create a `.env` file in `Backend/` (copy from the table below). All values have safe defaults for local development.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | HTTP + Socket.IO port |
| `MONGODB_URI` | `mongodb://localhost:27017/boardly` | MongoDB connection string |
| `JWT_SECRET` | `your_secure_jwt_secret_key_change_in_production` | **Change in production** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin (frontend) |
| `NODE_ENV` | `development` | `development` \| `production` |

```env
# .env (example)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/boardly
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

---

## 3. Running the Server

```bash
# Development (nodemon auto-restart)
npm run dev

# Production
npm start

# Health check (server running?)
curl http://localhost:5000/api/health
```

Expected health response:
```json
{ "status": "healthy", "uptime": 3.2, "timestamp": "...", "environment": "development" }
```

---

## 4. Running Tests

```bash
npm test
```

The test runner (`tests/runTests.js`):
- Boots an isolated **MongoMemoryServer** on port `5099` — no external MongoDB needed
- Registers Alice & Bob, exercises every REST endpoint
- Emits a **Postman collection** → `tests/Boardly.postman_collection.json`
- Exits `0` on success, `1` on any failure

**Import the Postman collection:**  
`Postman → Import → File → tests/Boardly.postman_collection.json`  
Set the `baseUrl` variable to `http://localhost:5000` before running.

---

## 5. REST API Reference

All board endpoints require a `Bearer <token>` Authorization header unless noted.  
Base URL: `http://localhost:5000`

### Auth

| Method | Path | Auth | Body | Success | Description |
|--------|------|------|------|---------|-------------|
| `POST` | `/api/auth/register` | ✗ | `{ name, email, password }` | `201 { token, user }` | Register a new account |
| `POST` | `/api/auth/login` | ✗ | `{ email, password }` | `200 { token, user }` | Log in |
| `GET` | `/api/auth/me` | ✓ | — | `200 { user }` | Return current user |

### Boards

| Method | Path | Role required | Body | Success | Description |
|--------|------|--------------|------|---------|-------------|
| `GET` | `/api/boards` | authenticated | — | `200 { owned[], joined[], boards[] }` | List boards (FR-10) |
| `POST` | `/api/boards` | authenticated | `{ title?, gridType?, defaultRole?, isPublic?, backgroundColor? }` | `201 { board }` | Create board (FR-01) |
| `POST` | `/api/boards/join` | authenticated | `{ code }` | `200 { boardId, role, board }` | Join by room code (FR-02) |
| `GET` | `/api/boards/code/:code` | any role | — | `200 { board, elements[], userRole }` | Hydrate board by room code |
| `GET` | `/api/boards/:id` | any role | — | `200 { board, elements[], userRole }` | Hydrate board + elements (FR-08) |
| `PATCH` | `/api/boards/:id` | editor \| owner | `{ title?, backgroundColor?, gridType?, isPublic?, defaultRole? }` | `200 { board }` | Update board settings |
| `PATCH` | `/api/boards/:id/members` | **owner only** | `{ memberId, role }` | `200 { board, updatedMember }` | Change a member's role (FR-03) |
| `DELETE` | `/api/boards/:id` | **owner only** | — | `200 { success, boardId }` | Delete board + all elements |

### Common Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Validation error (missing field, invalid value) |
| `401` | Missing or invalid JWT |
| `403` | Authenticated but insufficient role |
| `404` | Board or member not found |
| `500` | Internal server error |

### Field Reference — Board Object

```jsonc
{
  "_id": "mongo-object-id",
  "title": "My Whiteboard",
  "roomCode": "D3N3KT",          // 6-char uppercase, unique
  "owner": { "_id", "name", "email", "avatarColor" },
  "members": [
    { "user": { "_id", "name", "email", "avatarColor" }, "role": "editor"|"viewer", "joinedAt": "ISO8601" }
  ],
  "isPublic": true,
  "defaultRole": "editor"|"viewer",
  "backgroundColor": "#ffffff",
  "gridType": "dots"|"lines"|"cross"|"none",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Field Reference — BoardElement Object

```jsonc
{
  "_id": "mongo-object-id",
  "boardId": "mongo-object-id",
  "elementId": "client-uuid",    // client-generated, unique per board
  "type": "stroke"|"rectangle"|"circle"|"line"|"arrow"|"text"|"sticky",
  "data": {},                    // tool-specific payload (Mixed)
  "zIndex": 0,
  "createdBy": "mongo-object-id",
  "lastModifiedBy": "mongo-object-id",
  "isDeleted": false,            // soft delete — excluded from hydration
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Role Hierarchy

```
owner  >  editor  >  viewer  >  (null = no access)
```

| Action | viewer | editor | owner |
|--------|:------:|:------:|:-----:|
| Read board & elements | ✓ | ✓ | ✓ |
| Draw / create elements | ✗ | ✓ | ✓ |
| Update board settings | ✗ | ✓ | ✓ |
| Change member roles | ✗ | ✗ | ✓ |
| Delete board | ✗ | ✗ | ✓ |

---

## 6. Socket.IO Events

Connect with: `io(url, { auth: { token: "<jwt>" } })`

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_board` | `{ boardId, userName?, avatarColor?, role? }` | Join a board room; ack `{ success, board, activeUsers, currentUser }` |
| `leave_board` | — | Leave the current board room |
| `cursor_move` | `{ boardId, x, y }` | Broadcast cursor position |
| `element_created` | `{ boardId, elementId, type, data, zIndex? }` | Create / upsert an element |
| `element_updated` | `{ boardId, elementId, data, zIndex? }` | Update an existing element |
| `element_deleted` | `{ boardId, elementId }` | Soft-delete an element |
| `clear_board` | `{ boardId }` | Remove all elements (editor+ only) |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `user_joined` | `{ socketId, id, name, avatarColor, role }` | Another user joined |
| `user_left` | `{ socketId, userId }` | A user disconnected |
| `active_users_changed` | `[...users]` | Full updated presence list |
| `cursor_moved` | `{ socketId, userId, userName, avatarColor, x, y }` | Remote cursor update |
| `element_created` | element object | Broadcast new element to peers |
| `element_updated` | element object | Broadcast element update to peers |
| `element_deleted` | `elementId` | Broadcast soft-delete to peers |
| `board_cleared` | — | Board was cleared |
| `permission_denied` | `{ message }` | Action rejected (viewer trying to draw, etc.) |

---

## 7. Requirement Traceability

| ID | Requirement | Where Implemented | Test |
|----|------------|-------------------|------|
| **FR-01** | Any authenticated user can create a board. The creator is the immutable owner. The board gets a unique 6-char room code. | `Room.generateUniqueRoomCode()` · `createBoard` controller · `POST /api/boards` | Test 1 |
| **FR-02** | Users join a board by entering its room code. On first join they receive `defaultRole`. | `joinBoardByCode` controller · `POST /api/boards/join` | Test 2 |
| **FR-03** | The owner can change any member's role between `editor` and `viewer`. | `updateMemberRole` controller · `PATCH /api/boards/:id/members` | Test 3 |
| **FR-04** | Editors can draw and modify elements in real time. | Socket `element_created` / `element_updated` handlers in `SocketManager.js` | — |
| **FR-05** | Viewers can see the canvas but cannot create or modify elements. | `requireEditorOrOwner` ACL + socket permission check | SEC-C |
| **FR-06** | All element changes are broadcast to every connected peer. | `socket.to(boardId).emit(...)` in `SocketManager.js` | — |
| **FR-07** | Cursors are broadcast to all peers in the same board room. | `cursor_move` → `cursor_moved` in `SocketManager.js` | — |
| **FR-08** | When a user opens a board, all non-deleted elements are returned sorted by `zIndex` then `createdAt`. | `getBoardDetails` controller · `GET /api/boards/:id` | Test 10 |
| **FR-09** | Elements support soft-delete (`isDeleted: true`) for undo support. | `BoardElement.isDeleted` field + `{ isDeleted: false }` query filter | Test 10 |
| **FR-10** | The dashboard shows two separate lists: boards the user **owns** and boards they have **joined**. | `getUserBoards` controller · `GET /api/boards` | Test 11 |
| **FR-11** | The owner can delete a board; all its elements are cascade-deleted. | `deleteBoard` controller + `BoardElement.deleteMany` | Test 4 |

### Access Control

| ID | Rule | Where Enforced | Test |
|----|------|---------------|------|
| **AC-01** | Joining a board twice must not create duplicate member entries. | `joinBoardByCode` — `members.find()` guard before push | Test 2 |
| **AC-02** | `getUserRole` priority: owner → member → public fallback → null. | `Room.getUserRole()` method | — |
| **AC-03** | A `null` role on a private board returns `403`. | `requireBoardAccess` middleware | Test 4 |
| **AC-04** | Only the owner may change member roles. | `requireOwnerOnly` on `PATCH /:id/members` | Test 3 & 4 |
| **AC-05** | Only editors and owners may modify board settings or draw elements. | `requireEditorOrOwner` on `PATCH /:id` + socket guards | Test 4 |
| **AC-06** | A viewer or editor cannot delete the board; only the owner can. | `requireOwnerOnly` on `DELETE /:id` | Test 4 |

---

## 8. Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   └── env.js               # Environment variable loader
│   ├── controllers/
│   │   └── boardController.js   # createBoard, getUserBoards, joinBoardByCode,
│   │                            # getBoardDetails, updateMemberRole,
│   │                            # updateBoardSettings, deleteBoard
│   ├── middleware/
│   │   ├── auth.js              # requireAuth, authenticateOptional
│   │   └── acl.js               # requireBoardAccess, requireEditorOrOwner,
│   │                            # requireOwnerOnly
│   ├── models/
│   │   ├── index.js             # Re-exports all models
│   │   ├── User.js              # name, email, password (bcrypt), avatarColor
│   │   ├── Room.js              # Board model + generateUniqueRoomCode() + getUserRole()
│   │   └── BoardElement.js      # elementId, type, data, zIndex, isDeleted (soft delete)
│   ├── routes/
│   │   ├── authRoutes.js        # POST /register, POST /login, GET /me
│   │   └── boardRoutes.js       # All /api/boards/* routes
│   ├── sockets/
│   │   ├── SocketManager.js     # io.use auth middleware + event handlers
│   │   └── handlers/
│   │       └── presenceHandler.js
│   ├── store/
│   │   └── dataStore.js         # Legacy in-memory store (used by old socket handlers)
│   └── server.js                # Express + Socket.IO + MongoDB bootstrap
└── tests/
    ├── runTests.js              # Integration test suite (REST + socket)
    └── Boardly.postman_collection.json  # Auto-generated on npm test
```

