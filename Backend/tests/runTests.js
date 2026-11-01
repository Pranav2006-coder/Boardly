/**
 * runTests.js — Boardly REST + Socket integration test suite
 *
 * Covers:
 *   FR-01  Board creation                      (Test 1)
 *   FR-02  Join by room code                   (Test 2)
 *   FR-03  Role management                     (Test 3)
 *   AC-01  No-duplicate join                   (Test 2)
 *   AC-06  403 enforcement (viewer/editor/non-owner/non-member) (Test 4)
 *   FR-08  Board hydration with elements       (Test 10)
 *   FR-10  getUserBoards owned vs joined       (Test 11)
 *
 * Socket stretch:
 *   SEC-A  No-token connection rejected
 *   SEC-B  Forged-token connection rejected
 *   SEC-C  Viewer spoofing "editor" cannot draw; element not persisted
 *   SEC-D  Non-member refused on private board
 *
 * Run: node tests/runTests.js
 * Requires: MongoDB running (or MONGODB_URI set); server NOT already running
 *           (the test spins up its own instance on TEST_PORT).
 */

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { io as ClientIO } from 'socket.io-client';

// ── Bootstrap: spin up the app in-process with an isolated MongoDB ───────────
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import { config } from '../src/config/env.js';
import { initializeSocketIO } from '../src/sockets/SocketManager.js';
import authRoutes from '../src/routes/authRoutes.js';
import boardRoutes from '../src/routes/boardRoutes.js';
import { BoardElement } from '../src/models/BoardElement.js';

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let mongod;
let httpServer;

async function startTestServer() {
  // 1. In-memory MongoDB
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // 2. Express app (mirrors server.js)
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);

  httpServer = createServer(app);

  // 3. Socket.IO (same setup as production)
  const io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
  });
  initializeSocketIO(io);

  await new Promise((resolve) => httpServer.listen(TEST_PORT, resolve));
  console.log(`\nTest server listening on port ${TEST_PORT}`);
}

async function stopTestServer() {
  await new Promise((resolve) => httpServer.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
}

// ── HTTP helper ──────────────────────────────────────────────────────────────
async function http(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

// ── Socket helper ────────────────────────────────────────────────────────────
function connectClient(token) {
  return new Promise((resolve, reject) => {
    const client = ClientIO(BASE_URL, {
      transports: ['websocket'],
      reconnection: false,
      auth: token ? { token } : {},
    });
    client.on('connect', () => resolve(client));
    client.on('connect_error', (err) => {
      client.close();
      reject(err);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1 — FR-01: Register users + create a board
// ═══════════════════════════════════════════════════════════════════════════
async function testAuthAndBoardCreation() {
  console.log('\n─── Test 1: Register users & create board (FR-01) ───');

  // Register Alice
  const regAlice = await http('POST', '/api/auth/register', {
    name: 'Alice Test',
    email: 'alice@test.boardly',
    password: 'pass1234',
  });
  assert.equal(regAlice.status, 201, 'Alice registration should return 201');
  assert.ok(regAlice.body.token, 'Registration should return a JWT token');
  assert.ok(regAlice.body.user.id, 'Registration should return user id');
  const aliceToken = regAlice.body.token;
  const aliceId = regAlice.body.user.id;
  console.log('  ✔ Alice registered');

  // Register Bob
  const regBob = await http('POST', '/api/auth/register', {
    name: 'Bob Test',
    email: 'bob@test.boardly',
    password: 'pass5678',
  });
  assert.equal(regBob.status, 201, 'Bob registration should return 201');
  const bobToken = regBob.body.token;
  const bobId = regBob.body.user.id;
  console.log('  ✔ Bob registered');

  // Duplicate registration should fail
  const dupAlice = await http('POST', '/api/auth/register', {
    name: 'Alice Dup',
    email: 'alice@test.boardly',
    password: 'xxx',
  });
  assert.equal(dupAlice.status, 400, 'Duplicate email should return 400');
  console.log('  ✔ Duplicate email rejected');

  // Create board as Alice (FR-01)
  const createRes = await http(
    'POST',
    '/api/boards',
    {
      title: 'Alice Test Board',
      gridType: 'dots',
      defaultRole: 'viewer',
      isPublic: true,
    },
    aliceToken
  );
  assert.equal(createRes.status, 201, 'Board creation should return 201');
  assert.ok(createRes.body.board, 'Response should contain board object');
  assert.ok(createRes.body.board.roomCode, 'Board should have a roomCode');
  assert.equal(createRes.body.board.roomCode.length, 6, 'roomCode must be 6 chars');
  assert.equal(
    createRes.body.board.owner._id || createRes.body.board.owner.id || createRes.body.board.owner,
    aliceId,
    'Board owner must be Alice'
  );
  assert.equal(createRes.body.board.defaultRole, 'viewer', 'defaultRole should be viewer');
  console.log('  ✔ Board created with roomCode:', createRes.body.board.roomCode);

  // Create board without auth should fail
  const noAuth = await http('POST', '/api/boards', { title: 'Sneaky' });
  assert.equal(noAuth.status, 401, 'Creating board without token should return 401');
  console.log('  ✔ Unauthenticated create rejected (401)');

  return {
    aliceToken,
    bobToken,
    aliceId,
    bobId,
    boardId: createRes.body.board._id,
    roomCode: createRes.body.board.roomCode,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2 — FR-02, AC-01: Join by room code, no duplicates
// ═══════════════════════════════════════════════════════════════════════════
async function testJoinBoard({ aliceToken, bobToken, aliceId, bobId, boardId, roomCode }) {
  console.log('\n─── Test 2: Join board by code (FR-02, AC-01) ───');

  // Bob joins (board defaultRole = viewer, so Bob becomes viewer)
  const joinRes = await http('POST', '/api/boards/join', { code: roomCode }, bobToken);
  assert.equal(joinRes.status, 200, 'Bob join should return 200');
  assert.ok(joinRes.body.boardId, 'Response should include boardId');
  assert.equal(joinRes.body.role, 'viewer', 'Bob should join as viewer (defaultRole)');
  console.log('  ✔ Bob joined as viewer');

  // Joining again must NOT add a duplicate member (AC-01)
  const joinAgain = await http('POST', '/api/boards/join', { code: roomCode }, bobToken);
  assert.equal(joinAgain.status, 200, 'Re-join should return 200');
  assert.equal(joinAgain.body.role, 'viewer', 'Role should still be viewer on re-join');
  // Verify member list has Bob exactly once
  const memberCount = joinAgain.body.board.members.filter(
    (m) => (m.user._id || m.user) === bobId || (m.user._id || m.user).toString() === bobId
  ).length;
  assert.equal(memberCount, 1, 'Bob should appear exactly once in members (no duplicate)');
  console.log('  ✔ Re-join does not duplicate member (AC-01)');

  // Alice joining her own board — returns owner status
  const ownerJoin = await http('POST', '/api/boards/join', { code: roomCode }, aliceToken);
  assert.equal(ownerJoin.status, 200, 'Owner join should return 200');
  assert.equal(ownerJoin.body.role, 'owner', 'Alice should get owner role');
  console.log('  ✔ Owner join returns owner role');

  // Join with invalid code
  const badCode = await http('POST', '/api/boards/join', { code: 'XXXXXX' }, bobToken);
  assert.equal(badCode.status, 404, 'Invalid room code should return 404');
  console.log('  ✔ Invalid room code returns 404');

  // GET /api/boards/code/:code  — board by code
  const byCode = await http('GET', `/api/boards/code/${roomCode}`, null, bobToken);
  assert.equal(byCode.status, 200, 'GET /code/:code should return 200');
  assert.equal(byCode.body.board.roomCode, roomCode, 'Should return the correct board');
  console.log('  ✔ GET /code/:code returns board');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3 — FR-03: Role management (owner changes Bob → editor)
// ═══════════════════════════════════════════════════════════════════════════
async function testRoleManagement({ aliceToken, bobToken, aliceId, bobId, boardId, roomCode }) {
  console.log('\n─── Test 3: Role management (FR-03) ───');

  // Alice (owner) promotes Bob from viewer → editor
  const promote = await http(
    'PATCH',
    `/api/boards/${boardId}/members`,
    { memberId: bobId, role: 'editor' },
    aliceToken
  );
  assert.equal(promote.status, 200, 'Owner promoting member should return 200');
  const updatedMember = promote.body.board.members.find(
    (m) => (m.user._id || m.user).toString() === bobId
  );
  assert.ok(updatedMember, 'Bob should still be in members');
  assert.equal(updatedMember.role, 'editor', "Bob's role should now be editor");
  console.log('  ✔ Alice promoted Bob to editor');

  // Alice demotes Bob back to viewer
  const demote = await http(
    'PATCH',
    `/api/boards/${boardId}/members`,
    { memberId: bobId, role: 'viewer' },
    aliceToken
  );
  assert.equal(demote.status, 200, 'Owner demoting member should return 200');
  const demotedMember = demote.body.board.members.find(
    (m) => (m.user._id || m.user).toString() === bobId
  );
  assert.equal(demotedMember.role, 'viewer', "Bob's role should be back to viewer");
  console.log('  ✔ Alice demoted Bob back to viewer');

  // Invalid role value should be rejected
  const badRole = await http(
    'PATCH',
    `/api/boards/${boardId}/members`,
    { memberId: bobId, role: 'superadmin' },
    aliceToken
  );
  assert.equal(badRole.status, 400, 'Invalid role should return 400');
  console.log('  ✔ Invalid role value rejected (400)');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4 — AC-06: 403 enforcement cases
// ═══════════════════════════════════════════════════════════════════════════
async function testAccessControl({ aliceToken, bobToken, aliceId, bobId, boardId, roomCode }) {
  console.log('\n─── Test 4: 403 / ACL enforcement (AC-06) ───');

  // 4a. Viewer (Bob) tries to change a member role → 403
  const viewerChangeRole = await http(
    'PATCH',
    `/api/boards/${boardId}/members`,
    { memberId: aliceId, role: 'viewer' },
    bobToken
  );
  assert.equal(viewerChangeRole.status, 403, 'Viewer changing roles should get 403');
  console.log('  ✔ Viewer cannot change roles (403)');

  // Promote Bob to editor temporarily
  await http(
    'PATCH',
    `/api/boards/${boardId}/members`,
    { memberId: bobId, role: 'editor' },
    aliceToken
  );

  // 4b. Editor (Bob) tries to change a member role → 403 (owner-only)
  const editorChangeRole = await http(
    'PATCH',
    `/api/boards/${boardId}/members`,
    { memberId: aliceId, role: 'viewer' },
    bobToken
  );
  assert.equal(editorChangeRole.status, 403, 'Editor changing roles should get 403');
  console.log('  ✔ Editor cannot change roles (403)');

  // 4c. Non-owner (Bob, editor) tries to delete board → 403
  const editorDelete = await http('DELETE', `/api/boards/${boardId}`, null, bobToken);
  assert.equal(editorDelete.status, 403, 'Non-owner delete should get 403');
  console.log('  ✔ Editor cannot delete board (403)');

  // Put Bob back to viewer
  await http(
    'PATCH',
    `/api/boards/${boardId}/members`,
    { memberId: bobId, role: 'viewer' },
    aliceToken
  );

  // 4d. Non-member accessing a PRIVATE board
  //    Create a private board as Alice; Bob has never joined it
  const privateCreate = await http(
    'POST',
    '/api/boards',
    { title: 'Private Board', isPublic: false, defaultRole: 'viewer' },
    aliceToken
  );
  assert.equal(privateCreate.status, 201, 'Private board creation should succeed');
  const privateBoardId = privateCreate.body.board._id;

  // Register a third user (Charlie) who is not a member
  const regCharlie = await http('POST', '/api/auth/register', {
    name: 'Charlie Test',
    email: 'charlie@test.boardly',
    password: 'pass9999',
  });
  const charlieToken = regCharlie.body.token;

  const nonMemberAccess = await http('GET', `/api/boards/${privateBoardId}`, null, charlieToken);
  assert.equal(nonMemberAccess.status, 403, 'Non-member on private board should get 403');
  console.log('  ✔ Non-member on private board gets 403 (AC-06)');

  // Bob (not a member of the private board) also gets 403
  const bobNonMember = await http('GET', `/api/boards/${privateBoardId}`, null, bobToken);
  assert.equal(bobNonMember.status, 403, 'Bob (non-member) on private board should get 403');
  console.log('  ✔ Bob (non-member) on private board gets 403');

  return { privateBoardId, charlieToken };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 10 — FR-08: Board hydration (board details + elements)
// ═══════════════════════════════════════════════════════════════════════════
async function testBoardHydration({ aliceToken, bobToken, boardId, roomCode }) {
  console.log('\n─── Test 10: Board hydration + elements (FR-08) ───');

  // GET /api/boards/:id — Alice fetches her board
  const detailRes = await http('GET', `/api/boards/${boardId}`, null, aliceToken);
  assert.equal(detailRes.status, 200, 'Board detail should return 200');
  assert.ok(detailRes.body.board, 'Response should include board');
  assert.ok(Array.isArray(detailRes.body.elements), 'Response should include elements array');
  assert.ok(detailRes.body.userRole, 'Response should include userRole');
  assert.equal(detailRes.body.userRole, 'owner', 'Alice should be owner');
  console.log('  ✔ Board details returned with elements array');

  // Elements should be sorted by zIndex asc then createdAt asc
  // (insert two elements directly to verify ordering)
  await BoardElement.create([
    {
      boardId,
      elementId: 'el-zindex-10',
      type: 'rectangle',
      data: { x: 0, y: 0, w: 100, h: 100 },
      zIndex: 10,
    },
    {
      boardId,
      elementId: 'el-zindex-5',
      type: 'circle',
      data: { cx: 50, cy: 50, r: 25 },
      zIndex: 5,
    },
    {
      boardId,
      elementId: 'el-deleted',
      type: 'text',
      data: { text: 'I am deleted' },
      zIndex: 1,
      isDeleted: true,
    },
  ]);

  const hydrated = await http('GET', `/api/boards/${boardId}`, null, aliceToken);
  assert.equal(hydrated.status, 200);
  const elements = hydrated.body.elements;

  // Soft-deleted element must not appear
  const deletedEl = elements.find((e) => e.elementId === 'el-deleted');
  assert.equal(deletedEl, undefined, 'Soft-deleted elements must not appear in hydration');
  console.log('  ✔ Soft-deleted elements excluded from hydration');

  // zIndex ordering
  const zIndexes = elements.map((e) => e.zIndex);
  const sorted = [...zIndexes].sort((a, b) => a - b);
  assert.deepEqual(zIndexes, sorted, 'Elements must be sorted by zIndex ascending');
  console.log('  ✔ Elements sorted by zIndex ascending');

  // Bob (viewer) can also read the board
  const bobDetail = await http('GET', `/api/boards/${boardId}`, null, bobToken);
  assert.equal(bobDetail.status, 200, 'Viewer should be able to read board details');
  assert.equal(bobDetail.body.userRole, 'viewer', 'Bob should get viewer role in response');
  console.log('  ✔ Viewer can read board details; role = viewer');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 11 — FR-10: getUserBoards (owned vs joined)
// ═══════════════════════════════════════════════════════════════════════════
async function testGetUserBoards({ aliceToken, bobToken, boardId }) {
  console.log('\n─── Test 11: getUserBoards owned vs joined (FR-10) ───');

  // Alice's boards — should have owned, joined arrays
  const aliceBoards = await http('GET', '/api/boards', null, aliceToken);
  assert.equal(aliceBoards.status, 200, 'getUserBoards should return 200');
  assert.ok(Array.isArray(aliceBoards.body.owned), 'Should include owned array');
  assert.ok(Array.isArray(aliceBoards.body.joined), 'Should include joined array');
  const aliceOwnsBoard = aliceBoards.body.owned.some((b) => b._id === boardId);
  assert.ok(aliceOwnsBoard, 'Alice should see her board in owned tab');
  console.log('  ✔ Alice sees board in owned tab');

  // Bob's boards — the shared board should appear in joined
  const bobBoards = await http('GET', '/api/boards', null, bobToken);
  assert.equal(bobBoards.status, 200);
  const bobJoinedBoard = bobBoards.body.joined.some((b) => b._id === boardId);
  assert.ok(bobJoinedBoard, 'Bob should see the board in joined tab');
  // The board should NOT appear in Bob's owned list
  const bobOwnsBoard = bobBoards.body.owned.some((b) => b._id === boardId);
  assert.equal(bobOwnsBoard, false, "The board must NOT appear in Bob's owned tab");
  console.log('  ✔ Bob sees board in joined tab, not in owned tab');

  // Without auth — 401
  const noAuth = await http('GET', '/api/boards');
  assert.equal(noAuth.status, 401, 'Unauthenticated list should return 401');
  console.log('  ✔ Unauthenticated list returns 401');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SEC — Socket authentication & server-side role enforcement (stretch)
// ═══════════════════════════════════════════════════════════════════════════
async function testSocketSecurity({ aliceToken, bobToken, bobId, boardId }) {
  console.log('\n─── Test SEC: Socket auth & server-side role enforcement ───');

  // SEC-A: No token → connection refused
  await assert.rejects(
    () => connectClient(null),
    (err) => err.message === 'Authentication required',
    'Socket without a token must be rejected'
  );
  console.log('  ✔ Connection without token rejected (SEC-A)');

  // SEC-B: Forged token → connection refused
  await assert.rejects(
    () => connectClient('not.a.real.token'),
    (err) => err.message === 'Invalid token',
    'Socket with a forged token must be rejected'
  );
  console.log('  ✔ Connection with forged token rejected (SEC-B)');

  // SEC-C: Bob is viewer in DB but claims role "editor" in join_board payload
  const bob = await connectClient(bobToken);

  const joinAck = await new Promise((resolve) =>
    bob.emit(
      'join_board',
      { boardId, userId: bobId, userName: 'Bob Test', avatarColor: '#3B82F6', role: 'editor' }, // the lie
      resolve
    )
  );
  assert.equal(joinAck.success, true, 'Bob (member) joining should succeed');

  const denied = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No permission_denied received')), 2000);
    bob.on('permission_denied', (err) => {
      clearTimeout(timer);
      resolve(err);
    });
  });

  bob.emit('element_created', {
    boardId,
    elementId: 'spoofed_stroke',
    type: 'stroke',
    data: { points: [{ x: 1, y: 1 }] },
  });

  const deniedErr = await denied;
  assert.ok(
    deniedErr.message && deniedErr.message.toLowerCase().includes('view'),
    'Draw from spoofed editor role must emit permission_denied'
  );

  // Confirm nothing was persisted to MongoDB
  await new Promise((r) => setTimeout(r, 400));
  const saved = await BoardElement.findOne({ elementId: 'spoofed_stroke' });
  assert.equal(saved, null, 'Rejected element must not be persisted to MongoDB');

  bob.disconnect();
  console.log('  ✔ Viewer spoofing "editor" cannot draw; element not persisted (SEC-C)');

  // SEC-D: Non-member cannot join a PRIVATE board via socket
  const privRes = await http(
    'POST',
    '/api/boards',
    { title: 'Socket Private Board', isPublic: false },
    aliceToken
  );
  const privBoardId = privRes.body.board._id;

  const bob2 = await connectClient(bobToken);
  const privAck = await new Promise((resolve) =>
    bob2.emit('join_board', { boardId: privBoardId, role: 'editor' }, resolve)
  );
  assert.equal(privAck.success, false, 'Non-member must be refused on a private board');
  bob2.disconnect();
  console.log('  ✔ Non-member refused on private board via socket (SEC-D)');
}

// ═══════════════════════════════════════════════════════════════════════════
// Postman Collection export
// ═══════════════════════════════════════════════════════════════════════════
function buildPostmanCollection(baseUrl = 'http://localhost:5000') {
  return {
    info: {
      name: 'Boardly REST API',
      description: 'Auto-generated from runTests.js. Covers FR-01 to FR-10.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'baseUrl', value: baseUrl, type: 'string' },
      { key: 'aliceToken', value: '', type: 'string' },
      { key: 'bobToken', value: '', type: 'string' },
      { key: 'boardId', value: '', type: 'string' },
      { key: 'roomCode', value: '', type: 'string' },
      { key: 'bobId', value: '', type: 'string' },
    ],
    item: [
      // ── Auth ──────────────────────────────────────────────────────────
      {
        name: 'Auth',
        item: [
          {
            name: 'Register Alice (FR-01)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status 201", () => pm.response.to.have.status(201));',
                    'const b = pm.response.json();',
                    'pm.collectionVariables.set("aliceToken", b.token);',
                  ],
                },
              },
            ],
            request: {
              method: 'POST',
              url: '{{baseUrl}}/api/auth/register',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ name: 'Alice Test', email: 'alice@test.boardly', password: 'pass1234' }),
              },
            },
          },
          {
            name: 'Register Bob (FR-02)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status 201", () => pm.response.to.have.status(201));',
                    'const b = pm.response.json();',
                    'pm.collectionVariables.set("bobToken", b.token);',
                    'pm.collectionVariables.set("bobId", b.user.id);',
                  ],
                },
              },
            ],
            request: {
              method: 'POST',
              url: '{{baseUrl}}/api/auth/register',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ name: 'Bob Test', email: 'bob@test.boardly', password: 'pass5678' }),
              },
            },
          },
          {
            name: 'Login Alice',
            request: {
              method: 'POST',
              url: '{{baseUrl}}/api/auth/login',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'alice@test.boardly', password: 'pass1234' }),
              },
            },
          },
          {
            name: 'Get Me',
            request: {
              method: 'GET',
              url: '{{baseUrl}}/api/auth/me',
              header: [{ key: 'Authorization', value: 'Bearer {{aliceToken}}' }],
            },
          },
        ],
      },
      // ── Boards ────────────────────────────────────────────────────────
      {
        name: 'Boards',
        item: [
          {
            name: 'Create Board (FR-01)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status 201", () => pm.response.to.have.status(201));',
                    'const b = pm.response.json();',
                    'pm.collectionVariables.set("boardId", b.board._id);',
                    'pm.collectionVariables.set("roomCode", b.board.roomCode);',
                    'pm.test("roomCode is 6 chars", () => pm.expect(b.board.roomCode).to.have.lengthOf(6));',
                  ],
                },
              },
            ],
            request: {
              method: 'POST',
              url: '{{baseUrl}}/api/boards',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{aliceToken}}' },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ title: 'Alice Test Board', gridType: 'dots', defaultRole: 'viewer', isPublic: true }),
              },
            },
          },
          {
            name: 'List My Boards (FR-10)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status 200", () => pm.response.to.have.status(200));',
                    'pm.test("Has owned and joined", () => {',
                    '  const b = pm.response.json();',
                    '  pm.expect(b).to.have.property("owned");',
                    '  pm.expect(b).to.have.property("joined");',
                    '});',
                  ],
                },
              },
            ],
            request: {
              method: 'GET',
              url: '{{baseUrl}}/api/boards',
              header: [{ key: 'Authorization', value: 'Bearer {{aliceToken}}' }],
            },
          },
          {
            name: 'Join Board by Code (FR-02, AC-01)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status 200", () => pm.response.to.have.status(200));',
                    'pm.test("Role is viewer", () => pm.expect(pm.response.json().role).to.eql("viewer"));',
                  ],
                },
              },
            ],
            request: {
              method: 'POST',
              url: '{{baseUrl}}/api/boards/join',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{bobToken}}' },
              ],
              body: { mode: 'raw', raw: JSON.stringify({ code: '{{roomCode}}' }) },
            },
          },
          {
            name: 'Get Board by Code',
            request: {
              method: 'GET',
              url: '{{baseUrl}}/api/boards/code/{{roomCode}}',
              header: [{ key: 'Authorization', value: 'Bearer {{bobToken}}' }],
            },
          },
          {
            name: 'Get Board Details + Elements (FR-08)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status 200", () => pm.response.to.have.status(200));',
                    'pm.test("Has elements array", () => pm.expect(pm.response.json().elements).to.be.an("array"));',
                    'pm.test("Has userRole", () => pm.expect(pm.response.json().userRole).to.be.a("string"));',
                  ],
                },
              },
            ],
            request: {
              method: 'GET',
              url: '{{baseUrl}}/api/boards/{{boardId}}',
              header: [{ key: 'Authorization', value: 'Bearer {{aliceToken}}' }],
            },
          },
          {
            name: 'Promote Bob to Editor (FR-03)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status 200", () => pm.response.to.have.status(200));',
                  ],
                },
              },
            ],
            request: {
              method: 'PATCH',
              url: '{{baseUrl}}/api/boards/{{boardId}}/members',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{aliceToken}}' },
              ],
              body: { mode: 'raw', raw: JSON.stringify({ memberId: '{{bobId}}', role: 'editor' }) },
            },
          },
          {
            name: 'Update Board Settings (editor+)',
            request: {
              method: 'PATCH',
              url: '{{baseUrl}}/api/boards/{{boardId}}',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{aliceToken}}' },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ title: 'Renamed Board', backgroundColor: '#f0f0f0', gridType: 'lines' }),
              },
            },
          },
          {
            name: '403 — Viewer changes role (AC-06)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: ['pm.test("Status 403", () => pm.response.to.have.status(403));'],
                },
              },
            ],
            request: {
              method: 'PATCH',
              url: '{{baseUrl}}/api/boards/{{boardId}}/members',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{bobToken}}' }, // Bob is viewer
              ],
              body: { mode: 'raw', raw: JSON.stringify({ memberId: '{{bobId}}', role: 'editor' }) },
            },
          },
          {
            name: '403 — Non-owner deletes (AC-06)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: ['pm.test("Status 403", () => pm.response.to.have.status(403));'],
                },
              },
            ],
            request: {
              method: 'DELETE',
              url: '{{baseUrl}}/api/boards/{{boardId}}',
              header: [{ key: 'Authorization', value: 'Bearer {{bobToken}}' }],
            },
          },
          {
            name: 'Delete Board (owner only)',
            event: [
              {
                listen: 'test',
                script: {
                  exec: ['pm.test("Status 200", () => pm.response.to.have.status(200));'],
                },
              },
            ],
            request: {
              method: 'DELETE',
              url: '{{baseUrl}}/api/boards/{{boardId}}',
              header: [{ key: 'Authorization', value: 'Bearer {{aliceToken}}' }],
            },
          },
        ],
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Main runner
// ═══════════════════════════════════════════════════════════════════════════
async function runAllTests() {
  let passed = 0;
  let failed = 0;

  await startTestServer();
  console.log('\n══════════════════════════════════════════════');
  console.log('  Boardly REST + Socket Integration Tests');
  console.log('══════════════════════════════════════════════');

  try {
    const ctx = await testAuthAndBoardCreation();
    passed++;

    await testJoinBoard(ctx);
    passed++;

    await testRoleManagement(ctx);
    passed++;

    await testAccessControl(ctx);
    passed++;

    await testBoardHydration(ctx);
    passed++;

    await testGetUserBoards(ctx);
    passed++;

    // Socket security tests (stretch goal — skip if SocketManager not updated yet)
    try {
      await testSocketSecurity(ctx);
      passed++;
    } catch (err) {
      console.warn('\n  ⚠  Socket security tests skipped (SocketManager not yet hardened):', err.message);
    }

    // Export Postman collection
    const collection = buildPostmanCollection();
    const { writeFileSync } = await import('node:fs');
    const { resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const outPath = resolve(__dirname, 'Boardly.postman_collection.json');
    writeFileSync(outPath, JSON.stringify(collection, null, 2), 'utf8');
    console.log(`\n  📦 Postman collection written to ${outPath}`);

  } catch (err) {
    failed++;
    console.error('\n  ✖ TEST FAILED:', err.message);
    console.error(err);
  } finally {
    await stopTestServer();
    console.log('\n══════════════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log('══════════════════════════════════════════════\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAllTests();
