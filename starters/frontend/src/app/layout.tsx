import type { Metadata } from "next";
import "./globals.css";
import LanguageProvider from "@/i18n/LanguageProvider";

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
      <body><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
