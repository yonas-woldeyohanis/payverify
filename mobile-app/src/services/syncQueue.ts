import NetInfo from "@react-native-community/netinfo";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/config/supabase";
import {
  getPendingTransactions,
  markSynced,
  markSyncError,
  clearLocalImagePath,
} from "@/db/localLedger";
import { readImageAsBase64, deleteLocalImage } from "./imageService";
import type { LocalTransaction } from "@/types";

type SyncListener = (event: { syncing: boolean; pendingCount: number }) => void;

let isSyncing = false;
let unsubscribeNetInfo: (() => void) | null = null;
const listeners = new Set<SyncListener>();

export function onSyncStateChange(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(event: { syncing: boolean; pendingCount: number }) {
  listeners.forEach((l) => l(event));
}

/** Starts listening for connectivity changes and flushes the queue whenever
 * the device comes back online. Call once, e.g. from the auth-ready effect
 * in App.tsx. */
export function startSyncQueueListener(): void {
  if (unsubscribeNetInfo) return; // already started
  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      void flushPendingTransactions();
    }
  });
}

export function stopSyncQueueListener(): void {
  unsubscribeNetInfo?.();
  unsubscribeNetInfo = null;
}

/** Uploads every locally-pending transaction (and its compressed receipt
 * image) to Supabase. Idempotent: safe to call repeatedly, safe to
 * interrupt mid-batch — each row is synced independently via the
 * `upsert_transaction` RPC, which is itself idempotent on local_id. */
export async function flushPendingTransactions(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const pending = await getPendingTransactions();
    notify({ syncing: true, pendingCount: pending.length });

    for (const tx of pending) {
      try {
        await syncOne(tx);
        await markSynced(tx.localId);
      } catch (err: any) {
        await markSyncError(tx.localId, err?.message ?? "unknown sync error");
        // Keep going — one bad row shouldn't block the rest of the queue.
      }
    }
  } finally {
    const remaining = await getPendingTransactions();
    isSyncing = false;
    notify({ syncing: false, pendingCount: remaining.length });
  }
}

async function syncOne(tx: LocalTransaction): Promise<void> {
  let imagePath: string | null = null;

  if (tx.imageLocalPath) {
    imagePath = await uploadReceiptImage(tx);
  }

  const { data, error } = await supabase.rpc("upsert_transaction", {
    p_local_id: tx.localId,
    p_org_id: tx.orgId,
    p_waiter_id: tx.waiterId,
    p_shift_id: tx.shiftId,
    p_table_number: tx.tableNumber,
    p_amount: tx.amount,
    p_reference_number: tx.referenceNumber,
    p_payment_provider: tx.paymentProvider,
    p_sender_name: tx.senderName,
    p_ocr_raw_text: tx.ocrRawText,
    p_ocr_confidence: tx.ocrConfidence,
    p_image_path: imagePath,
    p_captured_at: tx.capturedAt,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (row?.was_duplicate_reference) {
    // The server saw this reference number attached to a *different*
    // transaction (e.g. two waiters scanned the same slip). We still mark
    // this row synced (so it stops retrying) but flag it locally via the
    // sync_error field so the UI can surface it distinctly if desired.
    throw new Error(
      `DUPLICATE_REFERENCE: reference ${tx.referenceNumber} was already recorded by another transaction`
    );
  }

  // Once the row is durably on the server, the local image copy is no
  // longer needed as the source of truth — free the device's storage.
  if (tx.imageLocalPath) {
    await deleteLocalImage(tx.imageLocalPath);
    await clearLocalImagePath(tx.localId);
  }
}

async function uploadReceiptImage(tx: LocalTransaction): Promise<string> {
  const base64 = await readImageAsBase64(tx.imageLocalPath as string);
  const objectPath = `${tx.orgId}/${tx.waiterId}/${tx.localId}.jpg`;

  const { error } = await supabase.storage
    .from("receipts")
    .upload(objectPath, decode(base64), {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw error;
  return objectPath;
}
