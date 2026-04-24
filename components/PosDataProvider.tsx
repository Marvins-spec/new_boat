"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

type Props = { children: React.ReactNode };

/**
 * Connects the POS store to Supabase (load data + order realtime). No data fetching in this component beyond calling the store.
 */
export function PosDataProvider({ children }: Props) {
  const bootstrap = useStore((s) => s.bootstrap);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      const fn = await bootstrap();
      if (!cancelled) cleanup = fn;
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [bootstrap]);

  return <>{children}</>;
}

/**
 * Shown on top of a page when env is missing; ordering still works with local fallbacks.
 */
export function SupabaseConfigHint() {
  if (isSupabaseConfigured()) return null;
  return (
    <div
      className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-100"
      role="status"
    >
      Supabase is not configured (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
      .env.local). Orders and stock are simulated locally; connect the backend for real-time sync
      and server-side stock.
    </div>
  );
}
