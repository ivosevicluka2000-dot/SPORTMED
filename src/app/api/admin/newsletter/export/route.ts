import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("newsletter_subscribers")
    .select("created_at, email, source, unsubscribed")
    .order("created_at", { ascending: false });
  if (error) return new NextResponse(error.message, { status: 500 });

  const headers = ["created_at", "email", "source", "unsubscribed"];
  const lines = [headers.join(",")];
  for (const row of data ?? []) {
    lines.push(
      headers
        .map((h) => csvEscape((row as Record<string, unknown>)[h]))
        .join(",")
    );
  }
  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
