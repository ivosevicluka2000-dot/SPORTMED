import { NextResponse } from "next/server";
import { isRaiAcceptConfigured } from "@/lib/raiaccept";

// Public probe used by the checkout form to decide whether to render the card
// payment option. Does not expose credentials — only a boolean.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ enabled: isRaiAcceptConfigured() });
}
