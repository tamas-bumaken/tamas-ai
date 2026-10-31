import { describe, expect, it } from "vitest";
import { detectImageMimeType } from "./wizard-image-validations";

function ascii(text: string) {
  return [...text].map((character) => character.charCodeAt(0));
}

describe("detectImageMimeType", () => {
  it("recognises the formats Gemini accepts from their first bytes", () => {
    expect(detectImageMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg",
    );
    expect(
      detectImageMimeType(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe("image/png");
    expect(
      detectImageMimeType(
        new Uint8Array([...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP")]),
      ),
    ).toBe("image/webp");
  });

  it("rejects another RIFF format that is not WebP", () => {
    expect(
      detectImageMimeType(
        new Uint8Array([...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE")]),
      ),
    ).toBeNull();
  });

  it("rejects a text file and an empty file", () => {
    expect(
      detectImageMimeType(new Uint8Array(ascii("<svg></svg>"))),
    ).toBeNull();
    expect(detectImageMimeType(new Uint8Array())).toBeNull();
  });
});
