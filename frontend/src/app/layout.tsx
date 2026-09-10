import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "zbus-architect",
  description: "Visual design tool for Zephyr zbus",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
