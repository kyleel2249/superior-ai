import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/shell";
import { ThemeProvider } from "@/components/theme-provider";
import CommandPalette from "@/components/command-palette";

export const metadata: Metadata = {
  title: "SUPERIOR AI",
  description: "One AI. An entire team behind it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <CommandPalette />
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
