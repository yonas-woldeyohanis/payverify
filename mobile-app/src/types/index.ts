export type UserRole = "waiter" | "manager" | "owner";

export interface AppUser {
  id: string;
  orgId: string;
  fullName: string;
  role: UserRole;
}

export type SyncStatus = "pending" | "synced" | "error";

export type PaymentProvider =
  | "Telebirr"
  | "CBE Birr"
  | "Dashen"
  | "M-Pesa"
  | "Awash"
  | "Unknown";

/** A transaction row as stored in the local SQLite ledger. */
export interface LocalTransaction {
  localId: string;
  orgId: string;
  waiterId: string;
  shiftId: string | null;
  tableNumber: string | null;
  amount: number;
  referenceNumber: string;
  paymentProvider: PaymentProvider;
  senderName: string | null;
  ocrRawText: string | null;
  ocrConfidence: number | null;
  imageLocalPath: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  capturedAt: string; // ISO timestamp
}

/** Result of running OCR + field extraction on a captured receipt image. */
export interface ParsedReceipt {
  amount: number | null;
  referenceNumber: string | null;
  senderName: string | null;
  provider: PaymentProvider;
  rawText: string;
  confidence: number;
}

export interface ShiftSummary {
  shiftId: string;
  openedAt: string;
  cashTotal: number;
  mobileTotal: number;
  byProvider: Record<string, number>;
  transactionCount: number;
}
