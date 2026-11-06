
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TakaTrack — Personal Finance",
  description: "Track spending, set budgets, and plan savings with TakaTrack.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

