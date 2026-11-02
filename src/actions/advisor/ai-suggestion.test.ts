import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();
const loadAdvisorMode = vi.fn();
const getMonthlySummary = vi.fn();
const startAiRequest = vi.fn();
const finishAiRequest = vi.fn();
const getCookieLocale = vi.fn();
const maybeSingle = vi.fn();
const upsert = vi.fn();

vi.mock("@/lib/genai", () => ({ ai: { models: { generateContent } } }));
vi.mock("@/lib/advisor-settings", () => ({ loadAdvisorMode }));
vi.mock("@/actions/transaction/actions", () => ({ getMonthlySummary }));
vi.mock("@/lib/auth", () => ({
  requireUserId: vi.fn(async () => "user-1"),
  getCurrentProfile: vi.fn(async () => ({
    business_name: "Warung Bu Ayu",
    business_type: "food_stall",
  })),
}));
vi.mock("@/lib/ai-usage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai-usage")>()),
  startAiRequest,
  finishAiRequest,
}));
vi.mock("@/i18n/server", () => ({
  getCookieLocale,
  getCookieTranslations: vi.fn(async (namespace: string) => (key: string) => {
    if (namespace === "categories") return `label:${key}`;
    return key;
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({ maybeSingle }),
      upsert,
    }),
  })),
}));

const { getAISuggestion } = await import("./ai-suggestion");

const SUGGESTION = {
  title: "Kurangi belanja bahan",
  explanation: "Biaya bahan Rp400.000. Coba tawar pemasok.",
  actionLabel: "Lihat biaya",
  actionMessage: "Bagaimana menekan biaya bahan Rp400.000?",
};

const SUMMARY = {
  current: {
    startDate: "2026-11-01",
    endDate: "2026-11-02",
    businessIncome: 800_000,
    businessExpense: 400_000,
    profit: 400_000,
    profitMarginPercent: 50,
    cashLeft: 250_000,
    ownerTaken: 150_000,
    ownerWithdrawals: 0,
    ceremony: 150_000,
  },
  spendingByCategory: [{ category: "Raw Materials", total: 400_000 }],
};

function geminiAnswer(text = JSON.stringify(SUGGESTION)) {
  return {
    text,
    usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 30 },
  };
}

function promptSent(): string {
  return generateContent.mock.calls[0][0].contents[0].parts[0].text;
}

beforeEach(() => {
  vi.clearAllMocks();
  loadAdvisorMode.mockResolvedValue("personal");
  getMonthlySummary.mockResolvedValue(SUMMARY);
  getCookieLocale.mockResolvedValue("id");
  startAiRequest.mockResolvedValue({ allowed: true, requestId: "request-1" });
  maybeSingle.mockResolvedValue({ data: null, error: null });
  upsert.mockResolvedValue({ error: null });
  generateContent.mockResolvedValue(geminiAnswer());
});

describe("getAISuggestion in General mode", () => {
  it("sends nothing to Gemini and does not read the figures", async () => {
    loadAdvisorMode.mockResolvedValue("general");

    await expect(getAISuggestion()).resolves.toEqual({ noData: true });

    expect(getMonthlySummary).not.toHaveBeenCalled();
    expect(startAiRequest).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("treats a failed mode lookup as General, so no data leaves by accident", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    loadAdvisorMode.mockRejectedValue(new Error("lookup failed"));

    await expect(getAISuggestion()).resolves.toEqual({ noData: true });

    expect(generateContent).not.toHaveBeenCalled();
    log.mockRestore();
  });
});

describe("getAISuggestion language", () => {
  it("asks for Bahasa Indonesia when that is the user's language", async () => {
    await getAISuggestion();

    expect(promptSent()).toContain("Write in Bahasa Indonesia");
    expect(promptSent()).not.toContain("Write in English");
  });

  it("asks for English when that is the user's language", async () => {
    getCookieLocale.mockResolvedValue("en");

    await getAISuggestion();

    expect(promptSent()).toContain("Write in English");
    expect(promptSent()).not.toContain("Write in Bahasa Indonesia");
  });

  it("gives the model the category in the user's language, not the stored English name", async () => {
    await getAISuggestion();

    expect(promptSent()).toContain("label:Raw Materials");
  });
});

describe("getAISuggestion quota", () => {
  it("checks the quota before calling Gemini and records the tokens after", async () => {
    await expect(getAISuggestion()).resolves.toEqual({
      suggestion: SUGGESTION,
    });

    expect(startAiRequest.mock.calls[0][1]).toBe("suggestion");
    expect(finishAiRequest.mock.calls[0][1]).toBe("request-1");
    expect(finishAiRequest.mock.calls[0][2]).toMatchObject({
      inputTokens: 120,
      outputTokens: 30,
    });
  });

  it("does not call Gemini when the user is over the limit", async () => {
    startAiRequest.mockResolvedValue({
      allowed: false,
      status: 429,
      message: "limit",
    });

    await expect(getAISuggestion()).resolves.toEqual({ error: "limit" });

    expect(generateContent).not.toHaveBeenCalled();
    expect(finishAiRequest).not.toHaveBeenCalled();
  });

  it("still closes the usage row when Gemini fails, and saves nothing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    generateContent.mockRejectedValue(new Error("busy"));

    await expect(getAISuggestion()).resolves.toEqual({ error: "failed" });

    expect(finishAiRequest).toHaveBeenCalledOnce();
    expect(upsert).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("rejects an answer that is not the expected JSON", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    generateContent.mockResolvedValue(geminiAnswer('{"title":""}'));

    await expect(getAISuggestion()).resolves.toEqual({ error: "failed" });

    expect(upsert).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("does not spend quota when there is nothing to base a suggestion on", async () => {
    getMonthlySummary.mockResolvedValue({
      current: { ...SUMMARY.current, businessIncome: 0, businessExpense: 0 },
      spendingByCategory: [],
    });

    await expect(getAISuggestion()).resolves.toEqual({ noData: true });

    expect(startAiRequest).not.toHaveBeenCalled();
  });
});

describe("getAISuggestion cache", () => {
  async function fingerprintOfLastSave() {
    await getAISuggestion();
    const saved = upsert.mock.calls[0][0];
    vi.clearAllMocks();
    return saved.fingerprint as string;
  }

  it("saves a new suggestion under the fingerprint of its inputs", async () => {
    await getAISuggestion();

    expect(upsert.mock.calls[0][0]).toMatchObject({ suggestion: SUGGESTION });
    expect(upsert.mock.calls[0][1]).toEqual({ onConflict: "user_id" });
  });

  it("reuses the stored suggestion while nothing has changed, without spending quota", async () => {
    const fingerprint = await fingerprintOfLastSave();
    maybeSingle.mockResolvedValue({
      data: { fingerprint, suggestion: SUGGESTION },
      error: null,
    });

    await expect(getAISuggestion()).resolves.toEqual({
      suggestion: SUGGESTION,
    });

    expect(startAiRequest).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("makes a new suggestion after a transaction changes the figures", async () => {
    const fingerprint = await fingerprintOfLastSave();
    maybeSingle.mockResolvedValue({
      data: { fingerprint, suggestion: SUGGESTION },
      error: null,
    });
    getMonthlySummary.mockResolvedValue({
      ...SUMMARY,
      current: { ...SUMMARY.current, businessExpense: 500_000 },
    });

    await getAISuggestion();

    expect(generateContent).toHaveBeenCalledOnce();
  });

  it("makes a new suggestion after the user changes language", async () => {
    const fingerprint = await fingerprintOfLastSave();
    maybeSingle.mockResolvedValue({
      data: { fingerprint, suggestion: SUGGESTION },
      error: null,
    });
    getCookieLocale.mockResolvedValue("en");

    await getAISuggestion();

    expect(generateContent).toHaveBeenCalledOnce();
  });

  it("ignores a stored suggestion with the wrong shape", async () => {
    const fingerprint = await fingerprintOfLastSave();
    maybeSingle.mockResolvedValue({
      data: { fingerprint, suggestion: { title: "broken" } },
      error: null,
    });

    await getAISuggestion();

    expect(generateContent).toHaveBeenCalledOnce();
  });

  it("still answers when reading or writing the cache fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    maybeSingle.mockResolvedValue({ data: null, error: new Error("read") });
    upsert.mockResolvedValue({ error: new Error("write") });

    await expect(getAISuggestion()).resolves.toEqual({
      suggestion: SUGGESTION,
    });

    log.mockRestore();
  });
});
