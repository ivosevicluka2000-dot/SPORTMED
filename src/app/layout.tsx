import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sport Care Med",
  description: "Sports medicine center in Šabac",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
