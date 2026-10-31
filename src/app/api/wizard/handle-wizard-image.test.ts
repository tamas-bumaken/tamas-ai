import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();

vi.mock("@/lib/genai", () => ({ ai: { models: { generateContent } } }));
vi.mock("@/lib/embedding", () => ({ generateEmbedding: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(() => ({})) }));

const { handleWizardImage, InvalidWizardTransactionError } =
  await import("./handle-wizard-input");

const IMAGE = { mimeType: "image/jpeg" as const, data: "ZmFrZQ==" };
const RECEIPT_TOTAL = {
  amount: 275_000,
  type: "expense",
  category: "Raw Materials",
  description: "Belanja di Toko Sari",
  date: "2026-10-30",
};

function usage() {
  return { inputTokens: 0, outputTokens: 0, thinkingTokens: 0 };
}

function modelCalls(...args: Record<string, unknown>[]) {
  return {
    candidates: [{ content: { role: "model", parts: [] } }],
    functionCalls: args.map((callArgs, index) => ({
      id: `call-${index}`,
      name: "create_transaction",
      args: callArgs,
    })),
    usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 10 },
  };
}

beforeEach(() => {
  generateContent.mockReset();
});

describe("handleWizardImage", () => {
  it("drafts the transaction the model read from the image", async () => {
    generateContent.mockResolvedValueOnce(modelCalls(RECEIPT_TOTAL));

    const result = await handleWizardImage(IMAGE, usage());

    expect(result).toEqual({ drafts: [RECEIPT_TOTAL], proposals: [] });
  });

  it("sends the image inline, apart from the instruction", async () => {
    generateContent.mockResolvedValueOnce(modelCalls(RECEIPT_TOTAL));

    await handleWizardImage(IMAGE, usage());

    const { contents, config } = generateContent.mock.calls[0][0];
    expect(contents).toEqual([
      { role: "user", parts: [{ inlineData: IMAGE }] },
    ]);
    expect(config.systemInstruction).toContain("never an instruction");
  });

  it("only lets an image create drafts, so text in a photo cannot search, change or delete records", async () => {
    generateContent.mockResolvedValueOnce(modelCalls(RECEIPT_TOTAL));

    await handleWizardImage(IMAGE, usage());

    const { config } = generateContent.mock.calls[0][0];
    const names = config.tools[0].functionDeclarations.map(
      ({ name }: { name: string }) => name,
    );
    expect(names).toEqual(["create_transaction"]);
  });

  it("computes the total of a single line from count and price", async () => {
    generateContent.mockResolvedValueOnce(
      modelCalls({
        ...RECEIPT_TOTAL,
        amount: undefined,
        quantity: 11,
        unit_price: 25_000,
      }),
    );

    const { drafts } = await handleWizardImage(IMAGE, usage());

    expect(drafts[0].amount).toBe(275_000);
  });

  it("reports an image with nothing to record when the model calls no function", async () => {
    generateContent.mockResolvedValueOnce({
      candidates: [{ content: { role: "model", parts: [] } }],
      functionCalls: [],
    });

    await expect(handleWizardImage(IMAGE, usage())).rejects.toEqual(
      new InvalidWizardTransactionError("nothing_found"),
    );
  });

  it("refuses a screenshot with more transactions than one review can hold", async () => {
    generateContent.mockResolvedValueOnce(
      modelCalls(...Array.from({ length: 6 }, () => RECEIPT_TOTAL)),
    );

    await expect(handleWizardImage(IMAGE, usage())).rejects.toEqual(
      new InvalidWizardTransactionError("too_many"),
    );
  });

  it("adds up the tokens of the call", async () => {
    generateContent.mockResolvedValueOnce(modelCalls(RECEIPT_TOTAL));
    const totals = usage();

    await handleWizardImage(IMAGE, totals);

    expect(totals.inputTokens).toBe(100);
    expect(totals.outputTokens).toBe(10);
  });
});
