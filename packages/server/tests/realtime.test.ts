import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc } from 'socket.io-client';
import { registerHandlers } from '../src/socket/handlers.js';
import db from '../src/db/db.js';

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
  ];
  for (const u of users) {
    db.exec(`INSERT OR IGNORE INTO users (id, display_name, avatar_color, created_at)
      VALUES ('${u.id}', '${u.display_name}', '${u.avatar_color}', ${NOW})`);
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

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        seedTestData();

        httpServer = createServer();
        ioServer = new Server(httpServer);
        registerHandlers(ioServer);
        httpServer.listen(0, () => {
          const addr = httpServer.address() as { port: number };
          serverPort = addr.port;
          clientSocketA = ioc(`http://localhost:${serverPort}`);
          clientSocketA.on('connect', resolve);
        });
      }),
    10_000
  );

  afterAll(() => {
    clientSocketA?.disconnect();
    clientSocketB?.disconnect();
    ioServer?.close();
  });

  it('rejects invalid or empty userId on group:join with error event', () =>
    new Promise<void>((resolve) => {
      clientSocketA.emit('group:join', {
        groupId: 'group-hackathon-01',
        userId: '',
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
        userId: 'user-alice',
      });

      clientSocketA.once('group:state', (stateA1) => {
        expect(stateA1.members).toBeDefined();
        expect(stateA1.members.some((m: any) => m.userId === 'user-alice')).toBe(true);

        // 2. Client B connects and joins the same group
        clientSocketB = ioc(`http://localhost:${serverPort}`);
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
            userId: 'user-bob',
          });
        });
      });
    }));

  it('broadcasts preference:updated on preference:update auto-save', () =>
    new Promise<void>((resolve) => {
      clientSocketA.emit('group:join', {
        groupId: 'group-hackathon-01',
        userId: 'user-david',
      });
      clientSocketA.once('group:state', () => {
        clientSocketA.emit('preference:update', {
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
        clientSocketA.once('preference:updated', (payload) => {
          expect(payload.groupMemberId).toBe('member-david');
          expect(payload.preferences.skills).toContain('SQL');
          resolve();
        });
      });
    }));

  it('broadcasts consensus:updated when leader triggers consensus:generate', () =>
    new Promise<void>((resolve) => {
      clientSocketA.emit('group:join', {
        groupId: 'group-hackathon-01',
        userId: 'user-alice',
      });
      clientSocketA.once('group:state', () => {
        clientSocketA.emit('consensus:generate', {
          groupId: 'group-hackathon-01',
          userId: 'user-alice',
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
