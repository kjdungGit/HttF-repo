import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Frontend starter", description: "Next.js and Tailwind starter" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
