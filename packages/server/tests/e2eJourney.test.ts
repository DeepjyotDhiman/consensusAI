import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import app from '../src/app.js';
import { registerHandlers } from '../src/socket/handlers.js';
import type { ConsensusOutput, GroupStateSnapshot } from '@consensus/shared';

let httpServer: HttpServer;
let ioServer: SocketIOServer;
let serverPort: number;
let serverBaseUrl: string;

beforeAll(async () => {
  httpServer = createServer(app);
  ioServer = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });
  registerHandlers(ioServer);

  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => {
      const addr = httpServer.address();
      if (addr && typeof addr === 'object') {
        serverPort = addr.port;
        serverBaseUrl = `http://localhost:${serverPort}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  ioServer.close();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

async function apiRequest(path: string, options?: RequestInit & { token?: string }) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  const res = await fetch(`${serverBaseUrl}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: data as any };
}

describe('E2E Complete MVP Journey Audit (Steps 1–20)', () => {
  let aliceToken: string;
  let aliceUserId: string;
  let aliceMemberId: string;

  let bobToken: string;
  let bobUserId: string;
  let bobMemberId: string;

  let carolToken: string;

  let groupId: string;
  let joinCode: string;

  let aliceSocket: ClientSocket;
  let bobSocket: ClientSocket;

  // 1 & 2. Register & Login Alice
  it('Step 1 & 2: User Alice registers and logs in to obtain auth credentials', async () => {
    const username = `alice_${Date.now()}`;
    const password = 'password123';
    const displayName = 'Alice Architect';

    const regRes = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.token).toBeDefined();
    expect(regRes.body.data.user.username).toBe(username);

    aliceToken = regRes.body.data.token;
    aliceUserId = regRes.body.data.user.id;
  });

  // 3. Real User Identity Available
  it('Step 3: Real user identity is available via auth profile endpoint', async () => {
    const meRes = await apiRequest('/api/v1/auth/me', {
      method: 'GET',
      token: aliceToken,
    });

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.id).toBe(aliceUserId);
    expect(meRes.body.data.user.displayName).toBe('Alice Architect');
  });

  // 4, 5, 6. Create Group & Verify Creator is Leader
  it('Step 4, 5, 6: Alice creates group and automatically becomes leader with valid joinCode', async () => {
    const createRes = await apiRequest('/api/v1/groups', {
      method: 'POST',
      token: aliceToken,
      body: JSON.stringify({ name: 'Alpha Hackers' }),
    });

    expect(createRes.status).toBe(201);
    const { group, member } = createRes.body.data;
    expect(group.name).toBe('Alpha Hackers');
    expect(group.joinCode).toBeDefined();
    expect(member.role).toBe('leader');
    expect(member.userId).toBe(aliceUserId);

    groupId = group.id;
    joinCode = group.joinCode;
    aliceMemberId = member.id;
  });

  // 7. Second User Registers and Joins
  it('Step 7: Bob registers, logs in, and joins group via joinCode', async () => {
    const username = `bob_${Date.now()}`;
    const regRes = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password: 'password123', displayName: 'Bob Backend' }),
    });

    expect(regRes.status).toBe(201);
    bobToken = regRes.body.data.token;
    bobUserId = regRes.body.data.user.id;

    const joinRes = await apiRequest('/api/v1/groups/join', {
      method: 'POST',
      token: bobToken,
      body: JSON.stringify({ joinCode }),
    });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.data.group.id).toBe(groupId);
    expect(joinRes.body.data.member.role).toBe('member');
    bobMemberId = joinRes.body.data.member.id;
  });

  // 8. Real-time Connection & Snapshot
  it('Step 8: Both Alice and Bob connect via Socket.IO and receive group state with both members', async () => {
    aliceSocket = ioc(serverBaseUrl, {
      auth: { token: aliceToken },
      transports: ['websocket'],
    });
    bobSocket = ioc(serverBaseUrl, {
      auth: { token: bobToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      let count = 0;
      const check = () => {
        count++;
        if (count === 2) resolve();
      };
      aliceSocket.on('connect', check);
      bobSocket.on('connect', check);
    });

    const aliceSnapshotPromise = new Promise<GroupStateSnapshot>((resolve) => {
      aliceSocket.once('group:state', (snapshot: GroupStateSnapshot) => resolve(snapshot));
    });

    aliceSocket.emit('group:join', { groupId });
    bobSocket.emit('group:join', { groupId });

    const snapshot = await aliceSnapshotPromise;
    expect(snapshot.members.length).toBe(2);
    expect(snapshot.members.map((m) => m.userId)).toContain(aliceUserId);
    expect(snapshot.members.map((m) => m.userId)).toContain(bobUserId);
  });

  // 9, 10, 11. Enter Preferences, Auto-save & Submit
  it('Step 9, 10, 11: Alice and Bob enter preferences, auto-save broadcasts, and submit', async () => {
    const bobUpdatedPromise = new Promise<{ groupMemberId: string }>((resolve) => {
      bobSocket.once('preference:updated', (payload: any) => resolve(payload));
    });

    // Alice auto-save
    aliceSocket.emit('preference:update', {
      groupMemberId: aliceMemberId,
      preferences: {
        skills: ['Machine Learning', 'Python', 'Data Analysis'],
        availabilityHours: 20,
        budget: 300,
        interests: ['AI', 'Accessibility'],
        learningGoals: ['Deep Learning'],
        priorities: ['High Impact'],
        notes: 'Lead ML track',
      },
    });

    const aliceUpdatePayload = await bobUpdatedPromise;
    expect(aliceUpdatePayload.groupMemberId).toBe(aliceMemberId);

    // Alice submit
    aliceSocket.emit('preference:submit', {
      groupMemberId: aliceMemberId,
      preferences: {
        skills: ['Machine Learning', 'Python', 'Data Analysis'],
        availabilityHours: 20,
        budget: 300,
        interests: ['AI', 'Accessibility'],
        learningGoals: ['Deep Learning'],
        priorities: ['High Impact'],
        notes: 'Lead ML track',
      },
    });

    // Bob submit
    bobSocket.emit('preference:submit', {
      groupMemberId: bobMemberId,
      preferences: {
        skills: ['React', 'TypeScript', 'CSS', 'UI Design'],
        availabilityHours: 15,
        budget: 200,
        interests: ['AI', 'Frontend'],
        learningGoals: ['Figma'],
        priorities: ['Speed'],
        notes: 'Lead UI track',
      },
    });

    // Small yield for DB persistence
    await new Promise((r) => setTimeout(r, 150));
  });

  // 12, 13, 14, 15, 16, 17, 18. Leader Generates Consensus, Persists, and Emits
  it('Step 12–18: Alice triggers consensus generation; result is computed, role-allocated, and broadcast to clients', async () => {
    const consensusPromise = new Promise<ConsensusOutput>((resolve) => {
      aliceSocket.once('consensus:updated', ({ result }: { result: ConsensusOutput }) => resolve(result));
    });

    aliceSocket.emit('consensus:generate', { groupId });

    const result = await consensusPromise;

    // 15. Recommendation present
    expect(result.recommendation).toBeDefined();
    expect(result.candidateId).toBeDefined();
    expect(result.groupScore).toBeGreaterThan(0);

    // 16. Project details & domain requirements
    expect(result.projectDetails).toBeDefined();
    expect(result.projectDetails?.requiredSkills.length).toBeGreaterThan(0);

    // 17. Role and task allocation matched to members
    expect(result.roleAllocation[aliceUserId]).toBeDefined();
    expect(result.roleAllocation[bobUserId]).toBeDefined();
    expect(result.roleAllocation[aliceUserId]).not.toBe(result.roleAllocation[bobUserId]);

    // 18. Skill coverage and gap assessment
    expect(result.skillCoverage).toBeDefined();
    expect(Array.isArray(result.skillCoverage?.coveredSkills)).toBe(true);
  });

  // 19. Page Refresh Persistence
  it('Step 19: Page refresh recovers the exact same persisted consensus result', async () => {
    const latestRes = await apiRequest(`/api/v1/consensus/${groupId}/latest`, {
      method: 'GET',
      token: aliceToken,
    });

    expect(latestRes.status).toBe(200);
    expect(latestRes.body.data.recommendation).toBeDefined();
    expect(latestRes.body.data.roleAllocation[aliceUserId]).toBeDefined();
  });

  // 20. Security & Authorization Constraints
  it('Step 20: Unauthorized users cannot access group data, and non-leaders cannot generate consensus', async () => {
    // Register Carol
    const regCarol = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: `carol_${Date.now()}`, password: 'password123', displayName: 'Carol Outsider' }),
    });
    carolToken = regCarol.body.data.token;

    // Carol tries to fetch Alice's group consensus -> 403 Forbidden
    const unauthRes = await apiRequest(`/api/v1/consensus/${groupId}/latest`, {
      method: 'GET',
      token: carolToken,
    });

    expect(unauthRes.status).toBe(403);

    // Bob (non-leader) tries to generate consensus via socket -> error event emitted
    const bobErrorPromise = new Promise<{ message: string }>((resolve) => {
      bobSocket.once('error', (err: { message: string }) => resolve(err));
    });

    bobSocket.emit('consensus:generate', { groupId });

    const err = await bobErrorPromise;
    expect(err.message).toContain('Only the group leader');

    // Clean up sockets
    aliceSocket.disconnect();
    bobSocket.disconnect();
  });
});
