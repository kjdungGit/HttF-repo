import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KEENFinance",
  description:
    "A friendly Illinois tax-year 2025 guide for young adults in Champaign. We prepare the checklist; you file the return.",
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
