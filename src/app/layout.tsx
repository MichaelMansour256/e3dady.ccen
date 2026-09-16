import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteConfig, themeConfig } from "@/config";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description.en,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: siteConfig.assets.appIcon,
    apple: siteConfig.assets.appIcon,
  },
};

export const viewport: Viewport = {
  themeColor: themeConfig.colors.primary,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
