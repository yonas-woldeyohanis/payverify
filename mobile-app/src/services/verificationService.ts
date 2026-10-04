import type { ParsedReceipt } from "@/types";

export type VerificationStatus = "verified" | "flagged" | "unverified";

export interface VerificationResult {
  status: VerificationStatus;
  reason?: string;
}

/**
 * Simulates checking the scanned receipt against a bank API, SMS gateway, 
 * or internal ledger to verify if the transfer is real.
 */
export async function verifyReceiptTransfer(receipt: ParsedReceipt): Promise<VerificationResult> {
  // In a real production app, this would make an API call to your backend:
  // e.g. await fetch('https://api.yourhotel.com/verify-transaction', { method: 'POST', body: JSON.stringify(receipt) })
  
  // For now, we simulate network delay:
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (!receipt.referenceNumber) {
    return { status: "flagged", reason: "Missing Transaction Reference Number" };
  }

  // Simulated logic to catch fake receipts:
  // If a fake receipt generator uses outdated formatting or generic TXN IDs, we flag it.
  const upperRef = receipt.referenceNumber.toUpperCase();

  // 1. Check for known fake template patterns (e.g., standard fake generators often use '1234' or '0000')
  if (upperRef.includes("1234") || upperRef.includes("0000")) {
    return { status: "flagged", reason: "Suspicious transaction reference pattern detected." };
  }

  // 2. Telebirr transactions usually start with specific prefixes. Let's simulate a check.
  if (receipt.provider === "Telebirr" && !upperRef.startsWith("T") && !upperRef.startsWith("0")) {
    return { status: "flagged", reason: "Telebirr reference numbers typically start with 'T' or '0'." };
  }

  // 3. CBE Birr transactions are usually alphanumeric and a specific length.
  if (receipt.provider === "CBE Birr" && upperRef.length < 8) {
    return { status: "flagged", reason: "CBE Birr transaction ID is too short to be valid." };
  }

  // 4. If amount is extremely large, flag for manual review.
  if (receipt.amount && receipt.amount > 50000) {
    return { status: "flagged", reason: "Amount exceeds auto-verification threshold. Manual review required." };
  }

  // If it passes all heuristics, we consider it verified.
  return { status: "verified" };
}
