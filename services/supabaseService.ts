import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

/**
 * Realtime: subscribe to `orders` changes and refetch from the service layer in the callback.
 * Keep database calls out of UI — pass a callback that calls orderService.fetchOrders, etc.
 */
export function subscribeToOrders(
  onOrdersChanged: () => void
): (() => void) | null {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const channel = supabase
    .channel("pos-orders")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => onOrdersChanged()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToIngredients(
  onIngredientsChanged: () => void
): (() => void) | null {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const channel = supabase
    .channel("pos-ingredients")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ingredients" },
      () => onIngredientsChanged()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
