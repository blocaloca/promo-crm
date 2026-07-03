import "./globals.css";
import type { Metadata } from "next";
import AppFrame from "./AppFrame";

export const metadata: Metadata = {
  title: "Promo CRM",
  description: "Outreach + promo organizer",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><meta name="theme-color" content="#0b0d0f" /></head>
      <body><AppFrame>{children}</AppFrame></body>
    </html>
  );
}
