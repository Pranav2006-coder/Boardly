const clientAlice = ClientIO(baseUrl, { transports: ['websocket'], auth: { token: aliceToken } });
const clientBob   = ClientIO(baseUrl, { transports: ['websocket'], auth: { token: bobToken } });

// Connects a socket client; resolves on connect, rejects with the server's error message
function connectClient(token) {
  return new Promise((resolve, reject) => {
    const client = ClientIO(baseUrl, {
      transports: ['websocket'],
      reconnection: false,          // fail once, don't keep retrying
      auth: token ? { token } : {},
    });
    client.on('connect', () => resolve(client));
    client.on('connect_error', (err) => {
      client.close();
      reject(err);
    });
  });
}

async function testSocketSecurity({ aliceToken, bobToken, bobId, boardId }) {
  console.log('\n--- 3. Testing Socket Authentication & Server-Side Role Enforcement ---');

  // Test A: No token -> connection refused
  await assert.rejects(
    () => connectClient(null),
    (err) => err.message === 'Authentication required',
    'Socket without a token must be rejected'
  );
  console.log('  ✔ Connection without token rejected');

  // Test B: Forged / invalid token -> connection refused
  await assert.rejects(
    () => connectClient('not.a.real.token'),
    (err) => err.message === 'Invalid token',
    'Socket with a forged token must be rejected'
  );
  console.log('  ✔ Connection with forged token rejected');

  // Test C: Bob is a VIEWER in the database but claims role "editor" in join_board
  const bob = await connectClient(bobToken);

  const joinAck = await new Promise((resolve) =>
    bob.emit(
      'join_board',
      { boardId, userId: bobId, userName: 'Bob Test', avatarColor: '#3B82F6', role: 'editor' }, // the lie
      resolve
    )
  );
  assert.strictEqual(joinAck.success, true, 'Bob is a member, so joining should succeed');

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

  const err = await denied;
  assert.ok(err.message.includes('View-only'), 'Draw from spoofed editor must be rejected');

  // Also confirm nothing was written to MongoDB
  await new Promise((r) => setTimeout(r, 400));
  const saved = await BoardElement.findOne({ elementId: 'spoofed_stroke' });
  assert.strictEqual(saved, null, 'Rejected element must not be persisted');
  console.log('  ✔ Viewer claiming "editor" role cannot draw (server uses DB role)');

  bob.disconnect();

  // Test D: Non-member cannot join a PRIVATE board
  const privRes = await fetch(`${baseUrl}/api/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ title: 'Private Board', isPublic: false }),
  });
  const privBoardId = (await privRes.json()).board._id;

  const bob2 = await connectClient(bobToken);
  const privAck = await new Promise((resolve) =>
    bob2.emit('join_board', { boardId: privBoardId, role: 'editor' }, resolve)
  );
  assert.strictEqual(privAck.success, false, 'Non-member must be refused on a private board');
  console.log('  ✔ Non-member refused on private board');

  bob2.disconnect();
}


const context = await testAuthAndBoardCreation();
await testRealTimeCollaboration(context);
await testSocketSecurity(context);      // <- new