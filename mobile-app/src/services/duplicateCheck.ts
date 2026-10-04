import { referenceNumberExistsLocally } from "@/db/localLedger";
import { supabase } from "@/config/supabase";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason: "local" | "server" | null;
}

/**
 * Two-tier duplicate check, run immediately after OCR extracts a reference
 * number and BEFORE the transaction is shown as "confirmed" to the waiter:
 *  1. Local SQLite (instant, works offline) — catches same-device re-scans.
 *  2. Server RPC (best-effort, only if online) — catches a different
 *     waiter/device having already banked the same reference number.
 * The server's unique index is still the ultimate source of truth; this is
 * about giving the waiter fast, friendly feedback before that failure would
 * otherwise surface during sync.
 */
export async function checkDuplicateReference(
  orgId: string,
  referenceNumber: string
): Promise<DuplicateCheckResult> {
  const localHit = await referenceNumberExistsLocally(orgId, referenceNumber);
  if (localHit) return { isDuplicate: true, reason: "local" };

  try {
    const { data, error } = await supabase.rpc("check_duplicate_reference", {
      p_org_id: orgId,
      p_reference_number: referenceNumber,
    });
    if (error) return { isDuplicate: false, reason: null }; // offline or RPC error — fall through, server unique index still protects us on sync
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.is_duplicate) return { isDuplicate: true, reason: "server" };
  } catch {
    // No network — that's fine, this is a best-effort check.
  }

  return { isDuplicate: false, reason: null };
}
