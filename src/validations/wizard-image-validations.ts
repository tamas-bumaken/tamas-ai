// Under Vercel's 4.5 MB request body limit, with room for the multipart envelope.
export const MAX_WIZARD_IMAGE_BYTES = 4 * 1024 * 1024;

export type WizardImageMimeType = "image/jpeg" | "image/png" | "image/webp";

export type WizardImage = {
  mimeType: WizardImageMimeType;
  // Base64, as Gemini's inline data expects it.
  data: string;
};

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

const ASCII_RIFF = [0x52, 0x49, 0x46, 0x46];
const ASCII_WEBP = [0x57, 0x45, 0x42, 0x50];

// Read from the file itself: the type a browser sends is whatever the caller says it is.
export function detectImageMimeType(
  bytes: Uint8Array,
): WizardImageMimeType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWith(bytes, ASCII_RIFF) && startsWith(bytes, ASCII_WEBP, 8)) {
    return "image/webp";
  }

  return null;
}
