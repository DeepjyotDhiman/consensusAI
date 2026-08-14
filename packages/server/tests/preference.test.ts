import { describe, it, expect, beforeEach } from 'vitest';
import db from '../src/db/db.js';
import * as PreferenceService from '../src/services/PreferenceService.js';

const NOW = Date.now();

function seedGroupAndMember(memberId: string, userId: string, groupId = 'g-test') {
  db.exec(`INSERT OR IGNORE INTO groups (id, join_code, name, created_at)
    VALUES ('${groupId}', 'CODE1', 'Test Group', ${NOW})`);
  db.exec(`INSERT OR IGNORE INTO users (id, display_name, avatar_color, created_at)
    VALUES ('${userId}', 'User ${userId}', '#abc', ${NOW})`);
  db.exec(`INSERT OR IGNORE INTO group_members (id, group_id, user_id, joined_at)
    VALUES ('${memberId}', '${groupId}', '${userId}', ${NOW})`);
}

beforeEach(() => {
  db.exec('DELETE FROM preferences');
  db.exec('DELETE FROM group_members');
  db.exec('DELETE FROM groups');
  db.exec('DELETE FROM users');
});

describe('PreferenceService', () => {
  it('upsert creates a new preference row', () => {
    seedGroupAndMember('mem-1', 'usr-1');
    const pref = PreferenceService.upsert('mem-1', {
      skills: ['Python', 'ML'],
      availabilityHours: 10,
      budget: 200,
      interests: ['AI'],
      learningGoals: ['Deep Learning'],
      priorities: [],
      notes: 'hello',
    });
    expect(pref.groupMemberId).toBe('mem-1');
    expect(pref.skills).toEqual(['Python', 'ML']);
    expect(pref.availabilityHours).toBe(10);
    expect(pref.budget).toBe(200);
    expect(pref.interests).toEqual(['AI']);
    expect(pref.id).toBeDefined();
  });

  it('second upsert updates existing row', () => {
    seedGroupAndMember('mem-2', 'usr-2');
    const first = PreferenceService.upsert('mem-2', { skills: ['React'], budget: 100 });
    const second = PreferenceService.upsert('mem-2', { budget: 999 });
    expect(second.id).toBe(first.id);
    expect(second.budget).toBe(999);
    expect(second.skills).toEqual(['React']);
  });

  it('get returns parsed JSON arrays', () => {
    seedGroupAndMember('mem-3', 'usr-3');
    PreferenceService.upsert('mem-3', {
      skills: ['Node', 'TypeScript'],
      interests: ['Backend', 'APIs'],
      learningGoals: ['Rust'],
    });
    const pref = PreferenceService.get('mem-3');
    expect(pref).not.toBeNull();
    expect(Array.isArray(pref!.skills)).toBe(true);
    expect(Array.isArray(pref!.interests)).toBe(true);
    expect(Array.isArray(pref!.learningGoals)).toBe(true);
    expect(pref!.skills).toContain('Node');
  });

  it('get returns null for non-existent member', () => {
    const pref = PreferenceService.get('no-such-member');
    expect(pref).toBeNull();
  });

  it('getAllForGroup returns members with preferences', () => {
    seedGroupAndMember('mem-a', 'usr-a', 'g-multi');
    seedGroupAndMember('mem-b', 'usr-b', 'g-multi');
    PreferenceService.upsert('mem-a', { skills: ['Go'], budget: 50 });

    const results = PreferenceService.getAllForGroup('g-multi');
    expect(results).toHaveLength(2);

    const memberA = results.find(r => r.member.id === 'mem-a');
    const memberB = results.find(r => r.member.id === 'mem-b');

    expect(memberA).toBeDefined();
    expect(memberA!.preference).not.toBeNull();
    expect(memberA!.preference!.skills).toContain('Go');

    expect(memberB).toBeDefined();
    expect(memberB!.preference).toBeNull();
  });
});
