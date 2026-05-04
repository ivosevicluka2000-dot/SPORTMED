import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 1. Let next-intl resolve the locale and produce a response
  //    (handles redirects/rewrites for locale prefixes).
  let response = intl(request);

  // 2. Refresh the Supabase session against that response so the
  //    Set-Cookie header lands on whatever next-intl returns.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Re-create the response so cookies merge with any next-intl
        // headers/rewrites already set.
        const newResponse = NextResponse.next({
          request: { headers: request.headers },
        });
        // Copy headers next-intl already set (Location for redirects, etc.)
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() === "set-cookie") return;
          newResponse.headers.set(key, value);
        });
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          newResponse.cookies.set(name, value, options);
        }
        for (const [k, v] of Object.entries(headers)) {
          newResponse.headers.set(k, v);
        }
        response = newResponse;
      },
    },
  });

  // Reading the user triggers a refresh if the access token is expired.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/", "/(sr|en)/:path*", "/((?!studio|api|_next|_vercel|.*\\..*).*)"],
};
