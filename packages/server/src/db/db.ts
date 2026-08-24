import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env["DB_PATH"] ?? join(__dirname, "..", "..", "consensusai.sqlite");
const SCHEMA_PATH = join(__dirname, "schema.sql");

const SQL = await initSqlJs();

let sqlDb: SqlJsDatabase;

if (existsSync(DB_PATH)) {
  const filebuffer = readFileSync(DB_PATH);
  sqlDb = new SQL.Database(filebuffer);
} else {
  sqlDb = new SQL.Database();
}

// Ensure schema is executed
const schema = readFileSync(SCHEMA_PATH, "utf-8");
sqlDb.exec(schema);

// Migrations for auth fields
try {
  sqlDb.exec("ALTER TABLE users ADD COLUMN username TEXT;");
} catch {}
try {
  sqlDb.exec("ALTER TABLE users ADD COLUMN password_hash TEXT;");
} catch {}
try {
  sqlDb.exec("ALTER TABLE groups ADD COLUMN user_id TEXT;");
} catch {}
// Migration: member_breakdowns sub-score column (schema.sql now includes this, migration kept for existing DBs)
try {
  sqlDb.exec("ALTER TABLE consensus_results ADD COLUMN member_breakdowns TEXT NOT NULL DEFAULT '{}';");
} catch {}
// Migration: role column on group_members (leader/member distinction)
try {
  sqlDb.exec("ALTER TABLE group_members ADD COLUMN role TEXT NOT NULL DEFAULT 'member';");
} catch {}
// Migration: submitted_at on preferences (formal submission timestamp)
try {
  sqlDb.exec("ALTER TABLE preferences ADD COLUMN submitted_at INTEGER DEFAULT NULL;");
} catch {}
// Migration: make budget nullable (was NOT NULL DEFAULT 0)
// SQLite does not support DROP NOT NULL; we tolerate the old constraint — zero is treated as null in scoring
try {
  sqlDb.exec("ALTER TABLE preferences ADD COLUMN _budget_nullable_sentinel INTEGER DEFAULT NULL;");
  sqlDb.exec("DROP TABLE IF EXISTS _budget_nullable_sentinel;"); // clean up if it ran twice
} catch {}

saveDb();

function saveDb() {
  if (DB_PATH === ":memory:") return; // tests use in-memory DB — nothing to save
  try {
    const data = sqlDb.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  } catch (err) {
    // Log persistence failures — silent data loss is worse than a noisy log
    console.error("[DB] Failed to persist database to disk:", err instanceof Error ? err.message : err);
  }
}

function normalizeParams(args: any[]): any {
  if (args.length === 0) return [];
  if (args.length === 1 && typeof args[0] === "object" && args[0] !== null && !Array.isArray(args[0])) {
    const obj = args[0];
    const bound: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const pKey = key.startsWith("@") || key.startsWith(":") || key.startsWith("$") ? key : "@" + key;
      bound[pKey] = obj[key];
    }
    return bound;
  }
  if (args.length === 1 && Array.isArray(args[0])) {
    return args[0];
  }
  return args;
}

class Statement {
  private sql: string;

  constructor(sql: string) {
    this.sql = sql;
  }

  public run(...args: any[]): { changes: number; lastInsertRowid: number } {
    const params = normalizeParams(args);
    sqlDb.run(this.sql, params);
    saveDb();
    return { changes: 1, lastInsertRowid: 1 };
  }

  public get<T = any>(...args: any[]): T | undefined {
    const params = normalizeParams(args);
    const stmt = sqlDb.prepare(this.sql);
    try {
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row as T;
      }
      stmt.free();
      return undefined;
    } catch (e) {
      stmt.free();
      throw e;
    }
  }

  public all<T = any>(...args: any[]): T[] {
    const params = normalizeParams(args);
    const stmt = sqlDb.prepare(this.sql);
    const results: T[] = [];
    try {
      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      stmt.free();
      return results;
    } catch (e) {
      stmt.free();
      throw e;
    }
  }
}

class DatabaseWrapper {
  public prepare<TParams extends any[] = any[], TResult = any>(sql: string): {
    run: (...args: any[]) => { changes: number; lastInsertRowid: number };
    get: (...args: any[]) => TResult | undefined;
    all: (...args: any[]) => TResult[];
  } {
    return new Statement(sql);
  }

  public exec(sql: string) {
    sqlDb.exec(sql);
    saveDb();
  }

  public pragma(_sql: string) {
    // PRAGMA commands handled in WASM
  }
}

const db = new DatabaseWrapper();

export default db;
