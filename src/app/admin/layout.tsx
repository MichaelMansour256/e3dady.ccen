import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = { title: "Admin — E3dady Gallery" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
