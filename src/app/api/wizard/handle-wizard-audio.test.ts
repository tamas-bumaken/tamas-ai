import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();

vi.mock("@/lib/genai", () => ({ ai: { models: { generateContent } } }));
vi.mock("@/lib/embedding", () => ({ generateEmbedding: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(() => ({})) }));

const { handleWizardAudio, InvalidWizardTransactionError } =
  await import("./handle-wizard-input");

const AUDIO = { mimeType: "audio/wav" as const, data: "UklGRg==" };
const SALE = {
  type: "income",
  category: "Sales",
  description: "Penjualan nasi campur 32 porsi",
  date: "2026-11-03",
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

describe("handleWizardAudio", () => {
  it("sends the recording inline, apart from the instruction", async () => {
    generateContent.mockResolvedValueOnce(
      modelCalls({ ...SALE, amount: 800_000 }),
    );

    await handleWizardAudio(AUDIO, usage());

    const { contents, config } = generateContent.mock.calls[0][0];
    expect(contents).toEqual([
      { role: "user", parts: [{ inlineData: AUDIO }] },
    ]);
    expect(config.systemInstruction).toContain("dua puluh lima ribu");
  });

  it("computes the total from the spoken count and price, not the model", async () => {
    generateContent.mockResolvedValueOnce(
      modelCalls({ ...SALE, quantity: 32, unit_price: 25_000 }),
    );

    const { drafts } = await handleWizardAudio(AUDIO, usage());

    expect(drafts[0].amount).toBe(800_000);
  });

  it("lets a spoken command search for a record to change, like typed text", async () => {
    generateContent.mockResolvedValueOnce(
      modelCalls({ ...SALE, amount: 800_000 }),
    );

    await handleWizardAudio(AUDIO, usage());

    const { config } = generateContent.mock.calls[0][0];
    const names = config.tools[0].functionDeclarations.map(
      ({ name }: { name: string }) => name,
    );
    expect(names).toContain("search_transactions");
  });

  it("reports a recording with nothing to record when the model calls no function", async () => {
    generateContent.mockResolvedValueOnce({
      candidates: [{ content: { role: "model", parts: [] } }],
      functionCalls: [],
    });

    await expect(handleWizardAudio(AUDIO, usage())).rejects.toEqual(
      new InvalidWizardTransactionError("nothing_found"),
    );
  });

  it("adds up the tokens of the call", async () => {
    generateContent.mockResolvedValueOnce(
      modelCalls({ ...SALE, amount: 800_000 }),
    );
    const totals = usage();

    await handleWizardAudio(AUDIO, totals);

    expect(totals.inputTokens).toBe(100);
  });
});
