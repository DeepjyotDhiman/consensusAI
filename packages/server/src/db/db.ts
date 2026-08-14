import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env["DB_PATH"] ?? join(__dirname, "..", "..", "consensusai.sqlite");
const SCHEMA_PATH = join(__dirname, "schema.sql");

function createDb(): Database.Database {
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  const schema = readFileSync(SCHEMA_PATH, "utf-8");
  database.exec(schema);

  return database;
}

const db: import("better-sqlite3").Database = createDb();

export default db;
