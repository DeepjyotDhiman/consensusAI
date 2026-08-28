import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc } from 'socket.io-client';
import { registerHandlers } from '../src/socket/handlers.js';
import db from '../src/db/db.js';
import { generateToken } from '../src/services/authService.js';

const NOW = Date.now();

// Seed the in-memory DB with the group + members needed by socket tests
function seedTestData() {
  db.exec(`INSERT OR IGNORE INTO groups (id, user_id, join_code, name, created_at)
    VALUES ('group-hackathon-01', 'user-alice', 'HACK01', 'Hackathon Team Alpha', ${NOW})`);

  const users = [
    { id: 'user-alice',  display_name: 'Alice',  avatar_color: '#6366f1' },
    { id: 'user-bob',    display_name: 'Bob',    avatar_color: '#f59e0b' },
    { id: 'user-carol',  display_name: 'Carol',  avatar_color: '#10b981' },
    { id: 'user-david',  display_name: 'David',  avatar_color: '#3b82f6' },
    { id: 'user-outsider', display_name: 'Outsider', avatar_color: '#999999' },
  ];
  for (const u of users) {
    db.exec(`INSERT OR IGNORE INTO users (id, username, password_hash, display_name, avatar_color, created_at)
      VALUES ('${u.id}', '${u.display_name.toLowerCase()}', 'dummyhash', '${u.display_name}', '${u.avatar_color}', ${NOW})`);
  }

  const members = [
    { id: 'member-alice', user_id: 'user-alice', role: 'leader' },
    { id: 'member-bob',   user_id: 'user-bob',   role: 'member' },
    { id: 'member-carol', user_id: 'user-carol', role: 'member' },
    { id: 'member-david', user_id: 'user-david', role: 'member' },
  ];
  for (const m of members) {
    db.exec(`INSERT OR IGNORE INTO group_members (id, group_id, user_id, role, joined_at)
      VALUES ('${m.id}', 'group-hackathon-01', '${m.user_id}', '${m.role}', ${NOW})`);
  }

  // Alice, Bob, Carol have submitted preferences — David does not (will be submitted during test)
  db.exec(`INSERT OR IGNORE INTO preferences
    (id, group_member_id, skills, availability_hours, budget, interests,
     learning_goals, priorities, notes, submitted_at, updated_at)
    VALUES (
      'pref-alice', 'member-alice',
      '["Machine Learning","Python","Data Analysis"]', 20, 500,
      '["AI","Social Impact"]', '["Deep Learning","MLOps"]', '[]', '', ${NOW}, ${NOW}
    )`);

  db.exec(`INSERT OR IGNORE INTO preferences
    (id, group_member_id, skills, availability_hours, budget, interests,
     learning_goals, priorities, notes, submitted_at, updated_at)
    VALUES (
      'pref-bob', 'member-bob',
      '["React","TypeScript","Python","UI Design"]', 10, 200,
      '["AI","Frontend"]', '["React Native","Accessibility"]', '[]', '', ${NOW}, ${NOW}
    )`);

  db.exec(`INSERT OR IGNORE INTO preferences
    (id, group_member_id, skills, availability_hours, budget, interests,
     learning_goals, priorities, notes, submitted_at, updated_at)
    VALUES (
      'pref-carol', 'member-carol',
      '["Network Security","Linux","Python"]', 15, 150,
      '["AI","Cybersecurity"]', '["Penetration Testing","Cryptography"]', '[]', '', ${NOW}, ${NOW}
    )`);
}

describe('Socket.IO realtime flow', () => {
  let httpServer: ReturnType<typeof createServer>;
  let ioServer: Server;
  let clientSocketA: ReturnType<typeof ioc>;
  let clientSocketB: ReturnType<typeof ioc>;
  let serverPort: number;

  const tokenAlice = generateToken({ userId: 'user-alice', username: 'alice' });
  const tokenBob = generateToken({ userId: 'user-bob', username: 'bob' });
  const tokenDavid = generateToken({ userId: 'user-david', username: 'david' });
  const tokenOutsider = generateToken({ userId: 'user-outsider', username: 'outsider' });

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        seedTestData();

        httpServer = createServer();
        ioServer = new Server(httpServer);
        registerHandlers(ioServer);
        httpServer.listen(0, '127.0.0.1', () => {
          const addr = httpServer.address() as { port: number };
          serverPort = addr.port;
          clientSocketA = ioc(`http://127.0.0.1:${serverPort}`, {
            auth: { token: tokenAlice },
            transports: ['websocket'],
          });
          clientSocketA.on('connect', resolve);
        });
      }),
    10_000
  );

  afterAll(() => {
    clientSocketA?.disconnect();
    clientSocketB?.disconnect();
    ioServer?.close();
    httpServer?.close();
  });

  it('rejects unauthenticated socket connections with Authentication required error', () =>
    new Promise<void>((resolve) => {
      const unauthSocket = ioc(`http://127.0.0.1:${serverPort}`, {
        transports: ['websocket'],
      });
      unauthSocket.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication required');
        unauthSocket.disconnect();
        resolve();
      });
    }));

  it('rejects non-member from joining group room with error event', () =>
    new Promise<void>((resolve) => {
      const outsiderSocket = ioc(`http://127.0.0.1:${serverPort}`, {
        auth: { token: tokenOutsider },
        transports: ['websocket'],
      });
      outsiderSocket.on('connect', () => {
        outsiderSocket.emit('group:join', {
          groupId: 'group-hackathon-01',
        });
        outsiderSocket.once('error', (err) => {
          expect(err.message).toContain('You are not a member of this group');
          outsiderSocket.disconnect();
          resolve();
        });
      });
    }));

  it('rejects invalid or empty groupId on group:join with error event', () =>
    new Promise<void>((resolve) => {
      clientSocketA.emit('group:join', {
        groupId: '',
      });
      clientSocketA.once('error', (err) => {
        expect(err.message).toContain('Invalid join payload');
        resolve();
      });
    }));

  it('broadcasts group:state to BOTH Client A and Client B when Client B joins', () =>
    new Promise<void>((resolve) => {
      // 1. Client A joins the group
      clientSocketA.emit('group:join', {
        groupId: 'group-hackathon-01',
      });

      clientSocketA.once('group:state', (stateA1) => {
        expect(stateA1.members).toBeDefined();
        expect(stateA1.members.some((m: any) => m.userId === 'user-alice')).toBe(true);

        // 2. Client B connects and joins the same group
        clientSocketB = ioc(`http://127.0.0.1:${serverPort}`, {
          auth: { token: tokenBob },
          transports: ['websocket'],
        });
        clientSocketB.on('connect', () => {
          let clientAReceived = false;
          let clientBReceived = false;

          function checkDone() {
            if (clientAReceived && clientBReceived) {
              resolve();
            }
          }

          // 4. Client A should receive updated group:state when B joins
          clientSocketA.once('group:state', (stateA2) => {
            expect(stateA2.members).toBeDefined();
            // 5. The state contains both members
            expect(stateA2.members.some((m: any) => m.userId === 'user-alice')).toBe(true);
            expect(stateA2.members.some((m: any) => m.userId === 'user-bob')).toBe(true);
            clientAReceived = true;
            checkDone();
          });

          // 3. Client B successfully receives group:state
          clientSocketB.once('group:state', (stateB) => {
            expect(stateB.members).toBeDefined();
            expect(stateB.members.some((m: any) => m.userId === 'user-alice')).toBe(true);
            expect(stateB.members.some((m: any) => m.userId === 'user-bob')).toBe(true);
            clientBReceived = true;
            checkDone();
          });

          clientSocketB.emit('group:join', {
            groupId: 'group-hackathon-01',
          });
        });
      });
    }));

  it('rejects preference:update when a member attempts to update another members preferences', () =>
    new Promise<void>((resolve) => {
      // clientSocketA is authenticated as Alice; attempt to update Bob's preferences (member-bob)
      clientSocketA.emit('preference:update', {
        groupMemberId: 'member-bob',
        preferences: {
          skills: ['SQL'],
          availabilityHours: 10,
          budget: 200,
          interests: ['AI'],
          learningGoals: [],
          priorities: [],
        },
      });
      clientSocketA.once('error', (err) => {
        expect(err.message).toContain('You can only update your own preferences');
        resolve();
      });
    }));

  it('broadcasts preference:updated on preference:update auto-save by the owner', () =>
    new Promise<void>((resolve) => {
      const socketDavid = ioc(`http://127.0.0.1:${serverPort}`, {
        auth: { token: tokenDavid },
        transports: ['websocket'],
      });

      socketDavid.on('connect', () => {
        socketDavid.emit('group:join', {
          groupId: 'group-hackathon-01',
        });
        socketDavid.once('group:state', () => {
          socketDavid.emit('preference:update', {
            groupMemberId: 'member-david',
            preferences: {
              id: 'pref-david',
              groupMemberId: 'member-david',
              skills: ['SQL', 'PostgreSQL'],
              availabilityHours: 12,
              budget: 300,
              interests: ['Data', 'AI'],
              learningGoals: ['Machine Learning'],
              priorities: [],
              notes: '',
              updatedAt: Date.now(),
            },
          });
          socketDavid.once('preference:updated', (payload) => {
            expect(payload.groupMemberId).toBe('member-david');
            expect(payload.preferences.skills).toContain('SQL');
            socketDavid.disconnect();
            resolve();
          });
        });
      });
    }));

  it('rejects consensus:generate from a non-leader member', () =>
    new Promise<void>((resolve) => {
      // clientSocketB is authenticated as Bob (member, not leader)
      clientSocketB.emit('consensus:generate', {
        groupId: 'group-hackathon-01',
      });
      clientSocketB.once('error', (err) => {
        expect(err.message).toContain('Only the group leader can generate the consensus');
        resolve();
      });
    }));

  it('broadcasts consensus:updated when authorized leader triggers consensus:generate', () =>
    new Promise<void>((resolve) => {
      clientSocketA.emit('group:join', {
        groupId: 'group-hackathon-01',
      });
      clientSocketA.once('group:state', () => {
        clientSocketA.emit('consensus:generate', {
          groupId: 'group-hackathon-01',
        });
        clientSocketA.once('consensus:updated', (payload) => {
          expect(payload.result).toBeDefined();
          expect(payload.result.groupScore).toBeGreaterThanOrEqual(0);
          expect(payload.result.groupScore).toBeLessThanOrEqual(100);
          expect(payload.result.recommendation).toBeDefined();
          resolve();
        });
      });
    }));
});
