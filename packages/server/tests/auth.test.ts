import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from '../src/services/authService.js';

describe('authService', () => {
  it('hashPassword returns a salt:hash formatted string', () => {
    const hash = hashPassword('mypassword');
    expect(hash).toContain(':');
    const parts = hash.split(':');
    expect(parts).toHaveLength(2);
    expect(parts[0]!.length).toBeGreaterThan(0); // salt
    expect(parts[1]!.length).toBeGreaterThan(0); // hash
  });

  it('verifyPassword returns true for the correct password', () => {
    const hash = hashPassword('correct_password');
    expect(verifyPassword('correct_password', hash)).toBe(true);
  });

  it('verifyPassword returns false for an incorrect password', () => {
    const hash = hashPassword('correct_password');
    expect(verifyPassword('wrong_password', hash)).toBe(false);
  });

  it('generateToken returns a 3-part JWT string', () => {
    const token = generateToken({ userId: 'user-1', username: 'alice' });
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0);
    }
  });

  it('verifyToken returns the payload for a valid token', () => {
    const token = generateToken({ userId: 'user-1', username: 'alice' });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe('user-1');
    expect(payload!.username).toBe('alice');
  });

  it('verifyToken returns null for a tampered signature', () => {
    const token = generateToken({ userId: 'user-1', username: 'alice' });
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}.invalidsignature`;
    expect(verifyToken(tampered)).toBeNull();
  });

  it('verifyToken returns null for an expired token', () => {
    // Build a token manually with exp set 1 hour in the past
    const JWT_SECRET =
      process.env['JWT_SECRET'] || 'dev_only_change_in_production_jwt_secret_2026';
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({
        userId: 'u1',
        username: 'alice',
        exp: Math.floor(Date.now() / 1000) - 3600,
      })
    ).toString('base64url');
    const sig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    const expiredToken = `${header}.${body}.${sig}`;
    expect(verifyToken(expiredToken)).toBeNull();
  });
});
