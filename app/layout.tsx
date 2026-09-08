import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chesslysis",
  description: "Advanced chess analytics powered by Stockfish.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
