import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc } from 'socket.io-client';
import { registerHandlers } from '../src/socket/handlers.js';
import db from '../src/db/db.js';

const NOW = Date.now();

// Seed the in-memory DB with the group + members needed by socket tests
function seedTestData() {
  db.exec(`INSERT OR IGNORE INTO groups (id, join_code, name, created_at)
    VALUES ('group-hackathon-01', 'HACK01', 'Hackathon Team Alpha', ${NOW})`);

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
    { id: 'member-alice', user_id: 'user-alice' },
    { id: 'member-bob',   user_id: 'user-bob'   },
    { id: 'member-carol', user_id: 'user-carol' },
    { id: 'member-david', user_id: 'user-david' },
  ];
  for (const m of members) {
    db.exec(`INSERT OR IGNORE INTO group_members (id, group_id, user_id, joined_at)
      VALUES ('${m.id}', 'group-hackathon-01', '${m.user_id}', ${NOW})`);
  }

  // Alice, Bob, Carol have preferences — David does not (will be added during test)
  db.exec(`INSERT OR IGNORE INTO preferences
    (id, group_member_id, skills, availability_hours, budget, interests,
     learning_goals, priorities, notes, updated_at)
    VALUES (
      'pref-alice', 'member-alice',
      '["Machine Learning","Python","Data Analysis"]', 20, 500,
      '["AI","Social Impact"]', '["Deep Learning","MLOps"]', '[]', '', ${NOW}
    )`);

  db.exec(`INSERT OR IGNORE INTO preferences
    (id, group_member_id, skills, availability_hours, budget, interests,
     learning_goals, priorities, notes, updated_at)
    VALUES (
      'pref-bob', 'member-bob',
      '["React","TypeScript","Python","UI Design"]', 10, 200,
      '["AI","Frontend"]', '["React Native","Accessibility"]', '[]', '', ${NOW}
    )`);

  db.exec(`INSERT OR IGNORE INTO preferences
    (id, group_member_id, skills, availability_hours, budget, interests,
     learning_goals, priorities, notes, updated_at)
    VALUES (
      'pref-carol', 'member-carol',
      '["Network Security","Linux","Python"]', 15, 150,
      '["AI","Cybersecurity"]', '["Penetration Testing","Cryptography"]', '[]', '', ${NOW}
    )`);
}

describe('Socket.IO realtime flow', () => {
  let httpServer: ReturnType<typeof createServer>;
  let ioServer: Server;
  let clientSocket: ReturnType<typeof ioc>;

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        seedTestData();

        httpServer = createServer();
        ioServer = new Server(httpServer);
        registerHandlers(ioServer);
        httpServer.listen(0, () => {
          const addr = httpServer.address() as { port: number };
          clientSocket = ioc(`http://localhost:${addr.port}`);
          clientSocket.on('connect', resolve);
        });
      }),
    10_000
  );

  afterAll(() => {
    clientSocket.disconnect();
    ioServer.close();
  });

  it('emits group:state after group:join', () =>
    new Promise<void>((resolve) => {
      clientSocket.emit('group:join', {
        groupId: 'group-hackathon-01',
        userId: 'user-alice',
      });
      clientSocket.once('group:state', (payload) => {
        expect(payload.members).toBeDefined();
        expect(Array.isArray(payload.members)).toBe(true);
        resolve();
      });
    }));

  it('broadcasts consensus:updated after preference:update with >= 2 members having prefs', () =>
    new Promise<void>((resolve) => {
      clientSocket.emit('group:join', {
        groupId: 'group-hackathon-01',
        userId: 'user-david',
      });
      clientSocket.once('group:state', () => {
        clientSocket.emit('preference:update', {
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
        clientSocket.once('consensus:updated', (payload) => {
          expect(payload.result).toBeDefined();
          expect(payload.result.groupScore).toBeGreaterThanOrEqual(0);
          expect(payload.result.groupScore).toBeLessThanOrEqual(100);
          resolve();
        });
      });
    }));
});
