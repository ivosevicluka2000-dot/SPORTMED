import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rehab platforma | Sport Care & Med",
  robots: { index: false, follow: false },
};

export default function RehabRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
