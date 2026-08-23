import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/shell";

export const metadata: Metadata = {
  title: "SUPERIOR AI",
  description: "One AI. An entire team behind it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
