// A 30-second recording at 16 kHz mono 16-bit is about 1 MB; the margin covers slower devices that stop late.
export const MAX_WIZARD_AUDIO_BYTES = 2 * 1024 * 1024;

// The browser always re-encodes the recording to WAV: Gemini lists it as supported, unlike Chrome's WebM.
export type WizardAudio = {
  mimeType: "audio/wav";
  // Base64, as Gemini's inline data expects it.
  data: string;
};

const ASCII_RIFF = [0x52, 0x49, 0x46, 0x46];
const ASCII_WAVE = [0x57, 0x41, 0x56, 0x45];

// Read from the file itself: the type a browser sends is whatever the caller says it is.
export function isWavAudio(bytes: Uint8Array): boolean {
  return (
    ASCII_RIFF.every((byte, index) => bytes[index] === byte) &&
    ASCII_WAVE.every((byte, index) => bytes[8 + index] === byte)
  );
}

// About -46 dBFS: above a phone microphone's background hiss, below even quiet speech.
const SILENCE_RMS = 0.005;

// Gemini invented a sale from a silent recording in testing, so silence is rejected before it reaches the model.
// Assumes the 16-bit mono PCM the browser encodes; the samples follow the "data" chunk, wherever it sits.
export function isSilentWav(bytes: Uint8Array): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const id = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const size = view.getUint32(offset + 4, true);

    if (id === "data") {
      const end = Math.min(bytes.length, offset + 8 + size);
      let sumOfSquares = 0;
      let count = 0;

      for (let index = offset + 8; index + 1 < end; index += 2) {
        const sample = view.getInt16(index, true) / 0x8000;
        sumOfSquares += sample * sample;
        count++;
      }

      return count === 0 || Math.sqrt(sumOfSquares / count) < SILENCE_RMS;
    }

    // Chunks are padded to an even length.
    offset += 8 + size + (size % 2);
  }

  return true;
}
