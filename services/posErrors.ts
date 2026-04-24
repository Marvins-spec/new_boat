export class InsufficientStockError extends Error {
  override readonly name = "InsufficientStockError";
  constructor(message = "Not enough ingredients") {
    super(message);
  }
}

export class SupabaseNotConfiguredError extends Error {
  override readonly name = "SupabaseNotConfiguredError";
  constructor() {
    super("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}
