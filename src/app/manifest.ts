import type { MetadataRoute } from "next";
import { siteConfig, themeConfig } from "@/config";

/**
 * Dynamic PWA manifest generated from the site/theme configuration.
 * (Replaces the former static `public/manifest.json` so a new meeting only
 * edits the config.) Served at /manifest.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description.ar,
    start_url: "/",
    display: "standalone",
    background_color: themeConfig.colors.dark,
    theme_color: themeConfig.colors.dark,
    orientation: "portrait",
    icons: [
      {
        src: siteConfig.assets.appIcon,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: siteConfig.assets.appIcon,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: siteConfig.assets.appIcon,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}