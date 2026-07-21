import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-assistant",
});

export const metadata: Metadata = {
  title: "ספר זיכרון",
  description: "כלי איסוף חומרים לאלבום ברכה",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={assistant.variable}>{children}</body>
    </html>
  );
}
