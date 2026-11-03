import { describe, expect, it } from "vitest";
import { encodeWav } from "./encode-wizard-audio";

function text(view: DataView, offset: number, length: number) {
  return String.fromCharCode(
    ...Array.from({ length }, (_, index) => view.getUint8(offset + index)),
  );
}

describe("encodeWav", () => {
  it("writes a mono 16-bit PCM header Gemini can read", () => {
    const view = new DataView(encodeWav(new Float32Array(160), 16_000));

    expect(text(view, 0, 4)).toBe("RIFF");
    expect(text(view, 8, 4)).toBe("WAVE");
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint32(28, true)).toBe(32_000); // bytes per second
    expect(view.getUint16(34, true)).toBe(16);
    expect(text(view, 36, 4)).toBe("data");
  });

  it("sizes the file from the number of samples", () => {
    const buffer = encodeWav(new Float32Array(160), 16_000);
    const view = new DataView(buffer);

    expect(buffer.byteLength).toBe(44 + 320);
    expect(view.getUint32(4, true)).toBe(36 + 320);
    expect(view.getUint32(40, true)).toBe(320);
  });

  it("clamps samples outside [-1, 1] instead of wrapping them into noise", () => {
    const view = new DataView(
      encodeWav(new Float32Array([2, -2, 0.5, 0]), 16_000),
    );

    expect(view.getInt16(44, true)).toBe(32_767);
    expect(view.getInt16(46, true)).toBe(-32_768);
    expect(view.getInt16(48, true)).toBe(16_383);
    expect(view.getInt16(50, true)).toBe(0);
  });
});
