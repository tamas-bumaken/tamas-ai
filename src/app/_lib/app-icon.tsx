import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The same values as --primary, --foreground and --background in globals.css, which images cannot read.
export const BRAND_COLOR = "#30B155";
export const BRAND_BACKGROUND = "#E7E6E7";
const BRAND_TEXT = "#050315";

// iPhone launch screens, portrait, in CSS pixels. iOS ignores the manifest and shows a blank white screen while an
// installed app loads unless a startup image matches the device exactly.
export const SPLASH_SCREENS = [
  { id: "1320x2868", width: 440, height: 956, ratio: 3 }, // 16 Pro Max
  { id: "1206x2622", width: 402, height: 874, ratio: 3 }, // 16 Pro
  { id: "1290x2796", width: 430, height: 932, ratio: 3 }, // 14/15 Pro Max, 15/16 Plus
  { id: "1179x2556", width: 393, height: 852, ratio: 3 }, // 14/15 Pro, 15/16
  { id: "1284x2778", width: 428, height: 926, ratio: 3 }, // 12/13 Pro Max, 14 Plus
  { id: "1170x2532", width: 390, height: 844, ratio: 3 }, // 12/13/14, 12/13 Pro
  { id: "1125x2436", width: 375, height: 812, ratio: 3 }, // X/XS/11 Pro, 12/13 mini
  { id: "1242x2688", width: 414, height: 896, ratio: 3 }, // XS Max, 11 Pro Max
  { id: "828x1792", width: 414, height: 896, ratio: 2 }, // XR, 11
  { id: "1242x2208", width: 414, height: 736, ratio: 3 }, // 6/7/8 Plus
  { id: "750x1334", width: 375, height: 667, ratio: 2 }, // SE, 6/7/8
] as const;

export type SplashScreen = (typeof SPLASH_SCREENS)[number];

export function splashMediaQuery({ width, height, ratio }: SplashScreen) {
  return `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`;
}

// The app icon and name centered on the app's background, so launching looks intentional rather than broken.
// Uses the same file as the manifest's icon, so the launch screen matches the home screen.
export async function renderSplashScreen({
  width,
  height,
  ratio,
}: SplashScreen) {
  const icon = 96 * ratio;
  const logo = await readFile(join(process.cwd(), "public/icons/icon-512.png"));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16 * ratio,
        background: BRAND_BACKGROUND,
      }}
    >
      <img
        src={`data:image/png;base64,${logo.toString("base64")}`}
        alt=""
        width={icon}
        height={icon}
        style={{ borderRadius: icon * 0.22 }}
      />
      <div style={{ fontSize: 32 * ratio, color: BRAND_TEXT }}>TAMAS</div>
    </div>,
    { width: width * ratio, height: height * ratio },
  );
}
