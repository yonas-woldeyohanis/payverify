export type PaymentProvider =
  | "Telebirr"
  | "CBE Birr"
  | "Dashen"
  | "Awash"
  | "M-Pesa"
  | "Unknown";

export interface Transaction {
  id: string;
  org_id: string;
  waiter_id: string;
  waiter_name?: string;
  table_number: string | null;
  amount: number;
  currency: string;
  reference_number: string;
  payment_provider: PaymentProvider | string;
  sender_name: string | null;
  sync_status: "pending" | "synced" | "error";
  verification_status: "pending" | "verified" | "mismatched";
  is_flagged: boolean;
  flag_reason: string | null;
  captured_at: string;
  created_at: string;
}

export type StaffRole = "waiter" | "lead_waiter" | "cashier" | "manager" | "owner";

export interface WaiterProfile {
  id: string;
  full_name: string;
  role: StaffRole;
}

export interface WaiterEmployee {
  id: string;
  org_id: string;
  full_name: string;
  login_alias: string;
  pin: string;
  role: "waiter" | "lead_waiter" | "cashier";
  section: string;
  is_active: boolean;
  on_duty: boolean;
  phone?: string;
  created_at: string;
  total_sales_today: number;
  transaction_count_today: number;
}

export interface Shift {
  id: string;
  waiter_id: string;
  waiter_name?: string;
  opened_at: string;
  closed_at: string | null;
  status: "open" | "closed" | "reconciled";
  cash_total: number;
  mobile_total: number;
}
