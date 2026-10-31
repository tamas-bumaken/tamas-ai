import type { MetadataRoute } from "next";
import { BRAND_BACKGROUND, BRAND_COLOR, ICON_SIZES } from "./_lib/app-icon";

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
    icons: ICON_SIZES.flatMap((size) => [
      {
        src: `/icon/${size}`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: "any" as const,
      },
      {
        src: `/icon/${size}`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: "maskable" as const,
      },
    ]),
  };
}
