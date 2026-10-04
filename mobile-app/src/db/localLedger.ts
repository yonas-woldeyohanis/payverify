import { getDb } from "./schema";
import type { LocalTransaction, ShiftSummary, SyncStatus } from "@/types";

/** Thin data-access layer over the local SQLite ledger. Every write here is
 * synchronous-feeling from the UI's perspective but persisted immediately,
 * so the app survives a force-quit mid-shift with no data loss. */

export async function insertLocalTransaction(tx: LocalTransaction): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO transactions (
      local_id, org_id, waiter_id, shift_id, table_number, amount,
      reference_number, payment_provider, sender_name, ocr_raw_text,
      ocr_confidence, image_local_path, sync_status, captured_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      tx.localId,
      tx.orgId,
      tx.waiterId,
      tx.shiftId,
      tx.tableNumber,
      tx.amount,
      tx.referenceNumber,
      tx.paymentProvider,
      tx.senderName,
      tx.ocrRawText,
      tx.ocrConfidence,
      tx.imageLocalPath,
      tx.syncStatus,
      tx.capturedAt,
    ]
  );
}

/** Returns true if this reference number is already recorded for this org,
 * anywhere on this device (i.e. even for a different waiter's shift if the
 * device is shared) — the first line of duplicate-receipt defense, checked
 * before OCR results are even shown as confirmed. */
export async function referenceNumberExistsLocally(
  orgId: string,
  referenceNumber: string
): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM transactions WHERE org_id = ? AND reference_number = ?`,
    [orgId, referenceNumber]
  );
  return (row?.count ?? 0) > 0;
}

export async function getPendingTransactions(): Promise<LocalTransaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM transactions WHERE sync_status = 'pending' ORDER BY captured_at ASC`
  );
  return rows.map(rowToLocalTransaction);
}

export async function markSynced(localId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE transactions SET sync_status = 'synced', sync_error = NULL WHERE local_id = ?`,
    [localId]
  );
}

export async function markSyncError(localId: string, message: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE transactions SET sync_status = 'error', sync_error = ? WHERE local_id = ?`,
    [message, localId]
  );
}

export async function getShiftTransactions(shiftId: string): Promise<LocalTransaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM transactions WHERE shift_id = ? ORDER BY captured_at DESC`,
    [shiftId]
  );
  return rows.map(rowToLocalTransaction);
}

export async function getWaiterTransactions(waiterId: string): Promise<LocalTransaction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM transactions WHERE waiter_id = ? ORDER BY captured_at DESC LIMIT 50`,
    [waiterId]
  );
  return rows.map(rowToLocalTransaction);
}

export async function getShiftSummary(shiftId: string, cashTotal: number): Promise<ShiftSummary> {
  const rows = await getShiftTransactions(shiftId);
  const byProvider: Record<string, number> = {};
  let mobileTotal = 0;
  for (const r of rows) {
    byProvider[r.paymentProvider] = (byProvider[r.paymentProvider] ?? 0) + r.amount;
    mobileTotal += r.amount;
  }
  return {
    shiftId,
    openedAt: rows[rows.length - 1]?.capturedAt ?? new Date().toISOString(),
    cashTotal,
    mobileTotal,
    byProvider,
    transactionCount: rows.length,
  };
}

export async function countBySyncStatus(status: SyncStatus): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM transactions WHERE sync_status = ?`,
    [status]
  );
  return row?.count ?? 0;
}

/** Local device cleanup: drop cached receipt photo *paths* (and the files
 * themselves, via imageService.deleteLocalImage) for anything captured more
 * than 7 days ago, mirroring the server-side purge policy. Call once on
 * app launch. */
export async function getStaleLocalImagePaths(olderThanDays = 7): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ image_local_path: string }>(
    `SELECT image_local_path FROM transactions
     WHERE image_local_path IS NOT NULL
       AND captured_at < datetime('now', ?)`,
    [`-${olderThanDays} days`]
  );
  return rows.map((r) => r.image_local_path);
}

export async function clearLocalImagePath(localId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE transactions SET image_local_path = NULL WHERE local_id = ?`, [localId]);
}

function rowToLocalTransaction(row: any): LocalTransaction {
  return {
    localId: row.local_id,
    orgId: row.org_id,
    waiterId: row.waiter_id,
    shiftId: row.shift_id,
    tableNumber: row.table_number,
    amount: row.amount,
    referenceNumber: row.reference_number,
    paymentProvider: row.payment_provider,
    senderName: row.sender_name,
    ocrRawText: row.ocr_raw_text,
    ocrConfidence: row.ocr_confidence,
    imageLocalPath: row.image_local_path,
    syncStatus: row.sync_status,
    syncError: row.sync_error,
    capturedAt: row.captured_at,
  };
}
