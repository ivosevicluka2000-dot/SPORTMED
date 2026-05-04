import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Singleton — safe to call from React
 * client components. Uses the public anon key only; all privileged
 * operations must go through a route handler/server action.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
