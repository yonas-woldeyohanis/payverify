// Centralized env access so the rest of the app never touches
// process.env directly (keeps it testable and mock-friendly).
export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  // White-labeling configuration
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME ?? "PayVerify",
  HOTEL_NAME: process.env.EXPO_PUBLIC_HOTEL_NAME ?? "Local Property",
  PRIMARY_COLOR: process.env.EXPO_PUBLIC_PRIMARY_COLOR ?? "#B8863C",
};

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  // Fail loudly in dev rather than silently hitting an empty URL later.
  console.warn(
    "[env] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env and fill in your Supabase project values."
  );
}
