// Enough for the small print on a long receipt or an e-wallet screenshot to stay readable.
const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.85;

export function fitWithinMaxEdge(
  width: number,
  height: number,
  maxEdge: number,
) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

// Phone photos exceed Vercel's 4.5 MB body limit, so every image is re-encoded before upload.
// Re-encoding also drops EXIF data, so the photo's location never leaves the device.
// Rejects when the browser cannot decode the file.
export async function compressWizardImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithinMaxEdge(
    bitmap.width,
    bitmap.height,
    MAX_EDGE,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");

  // JPEG has no transparency; without this a transparent PNG turns black and its text unreadable.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not encode the image")),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
