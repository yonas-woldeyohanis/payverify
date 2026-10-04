import * as SQLite from "expo-sqlite";

const DB_NAME = "payverify.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Returns a singleton connection to the on-device SQLite database.
 * Opened lazily so we never pay the open cost before it's needed
 * (e.g. on a splash screen).
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(dbInstance);
  return dbInstance;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      local_id          TEXT PRIMARY KEY NOT NULL,
      org_id            TEXT NOT NULL,
      waiter_id         TEXT NOT NULL,
      shift_id          TEXT,
      table_number      TEXT,
      amount            REAL NOT NULL,
      reference_number  TEXT NOT NULL,
      payment_provider  TEXT NOT NULL DEFAULT 'Unknown',
      sender_name       TEXT,
      ocr_raw_text      TEXT,
      ocr_confidence    REAL,
      image_local_path  TEXT,
      sync_status       TEXT NOT NULL DEFAULT 'pending',
      sync_error        TEXT,
      captured_at       TEXT NOT NULL,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Local duplicate guard mirrors the server's unique(org_id, reference_number)
    -- so a waiter gets instant feedback even while fully offline.
    CREATE UNIQUE INDEX IF NOT EXISTS idx_local_unique_ref
      ON transactions (org_id, reference_number);

    CREATE INDEX IF NOT EXISTS idx_local_sync_status
      ON transactions (sync_status);

    CREATE INDEX IF NOT EXISTS idx_local_shift
      ON transactions (shift_id);

    CREATE TABLE IF NOT EXISTS shifts (
      shift_id     TEXT PRIMARY KEY NOT NULL,
      org_id       TEXT NOT NULL,
      waiter_id    TEXT NOT NULL,
      opened_at    TEXT NOT NULL,
      cash_total   REAL NOT NULL DEFAULT 0,
      status       TEXT NOT NULL DEFAULT 'open',
      synced       INTEGER NOT NULL DEFAULT 0
    );
  `);
}

/** Used on logout / "reset device" so no stale data leaks to the next login. */
export async function wipeLocalDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`DELETE FROM transactions; DELETE FROM shifts;`);
}
