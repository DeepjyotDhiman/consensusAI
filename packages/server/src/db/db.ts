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

saveDb();

function saveDb() {
  try {
    const data = sqlDb.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  } catch (err) {
    // Ignore save errors during transient operations
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
  public prepare<TParams = any, TResult = any>(sql: string) {
    return new Statement(sql) as any;
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
