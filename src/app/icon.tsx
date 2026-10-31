import { ICON_SIZES, renderAppIcon } from "./_lib/app-icon";

// Served at /icon/192 and /icon/512 for the web app manifest.
export function generateImageMetadata() {
  return ICON_SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  return renderAppIcon(Number(await id));
}
