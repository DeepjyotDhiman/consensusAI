import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // isolate: true ensures each test file runs in its own module scope,
    // giving each file a fresh db.ts singleton (critical for in-memory SQLite).
    isolate: true,
    env: {
      DB_PATH: ':memory:'
    }
  }
});
