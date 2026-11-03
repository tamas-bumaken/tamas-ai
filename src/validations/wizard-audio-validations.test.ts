import { describe, expect, it } from "vitest";
import { isSilentWav, isWavAudio } from "./wizard-audio-validations";

function ascii(text: string) {
  return [...text].map((character) => character.charCodeAt(0));
}

function uint32(value: number) {
  return [
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    value >>> 24,
  ];
}

// A 16-bit mono WAV of the given samples, with optional chunks before "data" as some encoders write them.
function wav(samples: number[], extraChunks: number[] = []) {
  const pcm = samples.flatMap((sample) => {
    const value = Math.round(sample * 32767) & 0xffff;
    return [value & 0xff, value >> 8];
  });
  const fmt = [
    ...ascii("fmt "),
    ...uint32(16),
    1,
    0,
    1,
    0,
    ...uint32(16000),
    ...uint32(32000),
    2,
    0,
    16,
    0,
  ];
  const body = [
    ...ascii("WAVE"),
    ...fmt,
    ...extraChunks,
    ...ascii("data"),
    ...uint32(pcm.length),
    ...pcm,
  ];
  return new Uint8Array([...ascii("RIFF"), ...uint32(body.length), ...body]);
}

function tone(amplitude: number, length = 1600) {
  return Array.from({ length }, (_, index) => amplitude * Math.sin(index / 5));
}

describe("isWavAudio", () => {
  it("accepts the WAV file the browser encodes", () => {
    expect(
      isWavAudio(
        new Uint8Array([...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE")]),
      ),
    ).toBe(true);
  });

  it("rejects another RIFF format such as a WebP image", () => {
    expect(
      isWavAudio(
        new Uint8Array([...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP")]),
      ),
    ).toBe(false);
  });

  it("rejects an MP3, a WebM recording and an empty file", () => {
    expect(isWavAudio(new Uint8Array([...ascii("ID3"), 4, 0, 0]))).toBe(false);
    expect(isWavAudio(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]))).toBe(false);
    expect(isWavAudio(new Uint8Array())).toBe(false);
  });
});

describe("isSilentWav", () => {
  it("flags digital silence, which Gemini was seen turning into an invented sale", () => {
    expect(isSilentWav(wav(new Array(1600).fill(0)))).toBe(true);
  });

  it("flags a phone microphone's faint background hiss", () => {
    expect(isSilentWav(wav(tone(0.002)))).toBe(true);
  });

  it("lets quiet speech through", () => {
    expect(isSilentWav(wav(tone(0.05)))).toBe(false);
  });

  it("finds the samples after other chunks some encoders put before them", () => {
    const listChunk = [...ascii("LIST"), ...uint32(4), ...ascii("INFO")];

    expect(isSilentWav(wav(tone(0.05), listChunk))).toBe(false);
  });

  it("treats a file without samples as silent", () => {
    expect(isSilentWav(wav([]))).toBe(true);
  });
});
