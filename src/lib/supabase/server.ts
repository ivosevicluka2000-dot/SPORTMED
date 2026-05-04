import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use inside React Server Components, Server
 * Actions and Route Handlers. Cookies are read/written via Next.js
 * `cookies()` (async). Inside RSC rendering, `setAll` may throw —
 * that is expected; the proxy refreshes the session on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — ignore. Session refresh
            // happens in the proxy, which can write cookies.
          }
        },
      },
    }
  );
}
