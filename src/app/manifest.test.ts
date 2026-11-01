import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

// manifest.ts shares brand constants with the splash renderer, which pulls in next/og.
vi.mock("next/og", () => ({ ImageResponse: class {} }));

const { default: manifest } = await import("./manifest");

const PUBLIC_DIR = join(process.cwd(), "public");

// A PNG starts with its 8-byte signature, then the IHDR chunk whose first two fields are width and height.
function readPngSize(file: string) {
  const bytes = readFileSync(file);

  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("web app manifest icons", () => {
  const { icons = [] } = manifest();

  it("lists icons that exist in public/, at the size they declare", () => {
    expect(icons.length).toBeGreaterThan(0);

    for (const { src, sizes } of icons) {
      const [width, height] = (sizes ?? "").split("x").map(Number);

      expect(readPngSize(join(PUBLIC_DIR, src))).toEqual({ width, height });
    }
  });

  it("offers a 192 and a 512 icon, which installability requires", () => {
    const declared = icons.map(({ sizes }) => sizes);

    expect(declared).toContain("192x192");
    expect(declared).toContain("512x512");
  });

  it("keeps the maskable icon apart from the regular one, since Android crops it to a shape", () => {
    const regular = icons.filter(({ purpose }) => purpose === "any");
    const maskable = icons.filter(({ purpose }) => purpose === "maskable");

    expect(maskable.length).toBeGreaterThan(0);
    for (const { src } of maskable) {
      expect(regular.map((icon) => icon.src)).not.toContain(src);
    }
  });
});
