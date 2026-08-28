"use client";

import { usePathname } from "next/navigation";

export default function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const firstRouteSegment = segments[0] === "sr" || segments[0] === "en"
    ? segments[1]
    : segments[0];

  if (firstRouteSegment === "admin" || firstRouteSegment === "rehab") {
    return null;
  }

  return children;
}
