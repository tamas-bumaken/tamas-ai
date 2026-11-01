import type { MetadataRoute } from "next";
import { BRAND_BACKGROUND, BRAND_COLOR } from "./_lib/app-icon";

// Made from public/Logo/Logo-1.png on white. The maskable ones keep the logo inside the circle Android always shows,
// so any mask shape leaves it whole. Keep each file's size in step with `sizes` (manifest.test.ts checks it).
const ICONS = [
  { src: "/icons/icon-192.png", size: 192, purpose: "any" },
  { src: "/icons/icon-512.png", size: 512, purpose: "any" },
  { src: "/icons/icon-maskable-192.png", size: 192, purpose: "maskable" },
  { src: "/icons/icon-maskable-512.png", size: 512, purpose: "maskable" },
] as const;

// Makes TAMAS installable to the home screen (Phase 1 / 1.3); nothing works offline.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TAMAS",
    short_name: "TAMAS",
    description: "Asisten Bisnis AI untuk UMKM Bali",
    // Signed-out users are sent to the login page and come back here afterwards.
    start_url: "/dashboard",
    display: "standalone",
    background_color: BRAND_BACKGROUND,
    theme_color: BRAND_COLOR,
    icons: ICONS.map(({ src, size, purpose }) => ({
      src,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose,
    })),
  };
}
