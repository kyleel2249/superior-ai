import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUPERIOR AI — One AI. An Entire Team Behind It.",
  description:
    "Production-grade multi-model autonomous expert agent platform. Model-agnostic AI operating system with AI Council, continuous capacity, and durable task state.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
