import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://sportcaremed.rs";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Sport Care Med",
  description: "Sports medicine center in Šabac",
  applicationName: "Sport Care Med",
  referrer: "origin-when-cross-origin",
  authors: [{ name: "Sport Care Med" }],
  creator: "Sport Care Med",
  publisher: "Sport Care Med",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B2A4A",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
