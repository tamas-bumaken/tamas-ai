// Speech needs no more than 16 kHz, and mono halves the size again: 30 seconds is about 1 MB.
const SAMPLE_RATE = 16_000;
const WAV_HEADER_BYTES = 44;

function writeAscii(view: DataView, offset: number, text: string) {
  [...text].forEach((character, index) =>
    view.setUint8(offset + index, character.charCodeAt(0)),
  );
}

// Mono 16-bit PCM WAV, one of the audio formats Gemini lists as supported.
export function encodeWav(samples: Float32Array, sampleRate: number) {
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataBytes);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  samples.forEach((sample, index) => {
    // A loud peak above 1 would otherwise overflow into the opposite sign and click.
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(
      WAV_HEADER_BYTES + index * 2,
      clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
      true,
    );
  });

  return buffer;
}

// Browsers record in different containers (WebM in Chrome, MP4 in Safari), so every recording becomes the same WAV.
// Rejects when the browser cannot decode the recording.
export async function encodeWizardAudio(recording: Blob): Promise<Blob> {
  const context = new AudioContext();
  let decoded: AudioBuffer;

  try {
    decoded = await context.decodeAudioData(await recording.arrayBuffer());
  } finally {
    await context.close();
  }

  // Rendering into a one-channel context at 16 kHz mixes the channels down and resamples in one step.
  const offline = new OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * SAMPLE_RATE),
    SAMPLE_RATE,
  );
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();

  return new Blob([encodeWav(rendered.getChannelData(0), SAMPLE_RATE)], {
    type: "audio/wav",
  });
}
