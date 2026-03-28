import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FF2 - เว็บขายรูปนางแบบ",
  description: "แพลตฟอร์มออนไลน์สำหรับนางแบบและผู้ขายรูปภาพ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}
