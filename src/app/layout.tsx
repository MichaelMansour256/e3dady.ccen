import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E3dady Youth Meeting",
  description: "E3dady Youth Meeting – Christ Church Ezbet El Nakhl",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#1a3a8f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
