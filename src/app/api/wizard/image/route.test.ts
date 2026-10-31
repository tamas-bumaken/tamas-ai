import { ApiError } from "@google/genai";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserId = vi.fn();
const startAiRequest = vi.fn();
const finishAiRequest = vi.fn();
const handleWizardImage = vi.fn();

class InvalidWizardTransactionError extends Error {
  constructor(readonly reason: "too_many" | "nothing_found") {
    super(reason);
  }
}

vi.mock("@/lib/auth", () => ({ getUserId }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(() => ({})) }));
vi.mock("@/i18n/server", () => ({
  getCookieTranslations: vi.fn(() => (key: string) => key),
}));
vi.mock("@/lib/ai-usage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai-usage")>()),
  startAiRequest,
  finishAiRequest,
}));
vi.mock("../handle-wizard-input", () => ({
  handleWizardImage,
  InvalidWizardTransactionError,
  WIZARD_MODEL: "test-model",
}));

const { POST } = await import("./route");

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

function requestWith(image?: File | string) {
  const body = new FormData();
  if (image !== undefined) body.set("image", image);

  return new Request("http://localhost/api/wizard/image", {
    method: "POST",
    body,
  });
}

async function errorOf(response: Response) {
  return ((await response.json()) as { error: string }).error;
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserId.mockResolvedValue("user-1");
  startAiRequest.mockResolvedValue({ allowed: true, requestId: "request-1" });
  handleWizardImage.mockResolvedValue({ drafts: [], proposals: [] });
});

describe("POST /api/wizard/image", () => {
  it("rejects a signed-out caller before reading anything", async () => {
    getUserId.mockResolvedValue(null);

    const response = await POST(requestWith(new File([JPEG_BYTES], "a.jpg")));

    expect(response.status).toBe(401);
    expect(startAiRequest).not.toHaveBeenCalled();
  });

  it("rejects a request without a file, without using quota", async () => {
    const missing = await POST(requestWith());
    const text = await POST(requestWith("not a file"));

    expect(missing.status).toBe(400);
    expect(text.status).toBe(400);
    expect(startAiRequest).not.toHaveBeenCalled();
  });

  it("rejects a file over the limit, without using quota", async () => {
    const tooLarge = new File(
      [JPEG_BYTES, new Uint8Array(4 * 1024 * 1024)],
      "big.jpg",
    );

    const response = await POST(requestWith(tooLarge));

    expect(response.status).toBe(413);
    expect(await errorOf(response)).toBe("imageTooLarge");
    expect(startAiRequest).not.toHaveBeenCalled();
  });

  it("goes by the file's bytes, not the type the browser claims", async () => {
    const disguised = new File(["<svg></svg>"], "nota.jpg", {
      type: "image/jpeg",
    });

    const response = await POST(requestWith(disguised));

    expect(response.status).toBe(415);
    expect(await errorOf(response)).toBe("imageInvalid");
    expect(startAiRequest).not.toHaveBeenCalled();
  });

  it("passes the image to the model and records the tokens", async () => {
    const response = await POST(requestWith(new File([JPEG_BYTES], "a.jpg")));

    expect(response.status).toBe(200);
    expect(handleWizardImage.mock.calls[0][0]).toEqual({
      mimeType: "image/jpeg",
      data: Buffer.from(JPEG_BYTES).toString("base64"),
    });
    expect(finishAiRequest).toHaveBeenCalledOnce();
  });

  it("stops at the quota check when the user is over the limit", async () => {
    startAiRequest.mockResolvedValue({
      allowed: false,
      status: 429,
      message: "slow down",
    });

    const response = await POST(requestWith(new File([JPEG_BYTES], "a.jpg")));

    expect(response.status).toBe(429);
    expect(handleWizardImage).not.toHaveBeenCalled();
  });

  it("explains an image with nothing to record and still records the tokens", async () => {
    handleWizardImage.mockRejectedValue(
      new InvalidWizardTransactionError("nothing_found"),
    );

    const response = await POST(requestWith(new File([JPEG_BYTES], "a.jpg")));

    expect(response.status).toBe(422);
    expect(await errorOf(response)).toBe("imageNothingFound");
    expect(finishAiRequest).toHaveBeenCalledOnce();
  });

  it("explains a screenshot with too many transactions", async () => {
    handleWizardImage.mockRejectedValue(
      new InvalidWizardTransactionError("too_many"),
    );

    const response = await POST(requestWith(new File([JPEG_BYTES], "a.jpg")));

    expect(response.status).toBe(422);
    expect(await errorOf(response)).toBe("imageTooMany");
  });

  it("tells the user when Gemini is out of quota", async () => {
    handleWizardImage.mockRejectedValue(
      new ApiError({ message: "quota", status: 429 }),
    );

    const response = await POST(requestWith(new File([JPEG_BYTES], "a.jpg")));

    expect(response.status).toBe(503);
    expect(await errorOf(response)).toBe("busyWizard");
    expect(finishAiRequest).toHaveBeenCalledOnce();
  });

  it("hides an unexpected failure behind a generic message", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    handleWizardImage.mockRejectedValue(new Error("secret detail"));

    const response = await POST(requestWith(new File([JPEG_BYTES], "a.jpg")));

    expect(response.status).toBe(500);
    expect(await errorOf(response)).toBe("imageFailed");
    log.mockRestore();
  });
});
