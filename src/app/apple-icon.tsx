import { renderAppIcon } from "./_lib/app-icon";

// The home screen icon on iOS, which ignores the manifest icons.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderAppIcon(size.width);
}
