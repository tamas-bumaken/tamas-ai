import { FunctionCall } from "@google/genai";
import { describe, expect, it, vi } from "vitest";

// Search needs a Gemini embedding; these tests only cover drafting and proposals.
vi.mock("@/lib/embedding", () => ({ generateEmbedding: vi.fn() }));

const { getWizardToolDeclarations, runWizardTool } =
  await import("./wizard-tools");

type WizardRunState = Parameters<typeof runWizardTool>[1];
type SupabaseClient = Parameters<typeof runWizardTool>[2];

// Drafting and proposing never touch the database.
const noDatabase = {} as SupabaseClient;

function emptyState(): WizardRunState {
  return { knownRows: new Map(), drafts: [], proposals: new Map() };
}

function createCall(args: Record<string, unknown>): FunctionCall {
  return { id: "call-1", name: "create_transaction", args };
}

const SALE = {
  type: "income",
  category: "Sales",
  description: "Penjualan nasi campur 32 porsi",
  date: "2026-10-31",
};

describe("create_transaction", () => {
  it("multiplies quantity by unit price in code, so the model never does the arithmetic", async () => {
    const state = emptyState();

    const response = await runWizardTool(
      createCall({ ...SALE, quantity: 32, unit_price: 25_000 }),
      state,
      noDatabase,
    );

    expect(response.response?.output).toEqual({
      status: "drafted_for_user_review",
    });
    expect(state.drafts).toEqual([{ ...SALE, amount: 800_000 }]);
  });

  it("trusts the computed total over an amount the model also sent", async () => {
    const state = emptyState();

    await runWizardTool(
      createCall({
        ...SALE,
        amount: 750_000,
        quantity: 32,
        unit_price: 25_000,
      }),
      state,
      noDatabase,
    );

    expect(state.drafts[0].amount).toBe(800_000);
  });

  it("rounds a fractional quantity to whole rupiah", async () => {
    const state = emptyState();

    await runWizardTool(
      createCall({ ...SALE, quantity: 1.5, unit_price: 33_333 }),
      state,
      noDatabase,
    );

    expect(state.drafts[0].amount).toBe(50_000);
  });

  it("uses a plain amount when no quantity is given", async () => {
    const state = emptyState();

    await runWizardTool(
      createCall({
        type: "expense",
        category: "Raw Materials",
        description: "Beli ayam",
        date: "2026-10-31",
        amount: 400_000,
      }),
      state,
      noDatabase,
    );

    expect(state.drafts[0].amount).toBe(400_000);
  });

  it("sends the model back to fix a quantity without a unit price", async () => {
    const state = emptyState();

    const response = await runWizardTool(
      createCall({ ...SALE, quantity: 32 }),
      state,
      noDatabase,
    );

    expect(response.response?.error).toContain("Invalid arguments");
    expect(state.drafts).toEqual([]);
  });

  it("rejects a category that does not fit the type", async () => {
    const state = emptyState();

    const response = await runWizardTool(
      createCall({ ...SALE, category: "Raw Materials", amount: 1_000 }),
      state,
      noDatabase,
    );

    expect(response.response?.error).toContain("Invalid arguments");
    expect(state.drafts).toEqual([]);
  });

  it("does not require an amount in the schema sent to the model", () => {
    const create = getWizardToolDeclarations(false).find(
      ({ name }) => name === "create_transaction",
    );

    expect(create?.parametersJsonSchema).toMatchObject({
      properties: {
        quantity: { type: "number" },
        unit_price: { type: "number" },
      },
    });
    expect(
      (create?.parametersJsonSchema as { required: string[] }).required,
    ).not.toContain("amount");
  });
});

describe("update_transaction", () => {
  const id = "4b8f3a52-5c1d-4f6e-9a7b-2d3e4f5a6b7c";
  const before = {
    id,
    amount: 500_000,
    type: "income" as const,
    category: "Sales",
    description: "Penjualan",
    date: "2026-10-30",
  };

  it("computes the new total from quantity and unit price", async () => {
    const state = emptyState();
    state.knownRows.set(id, before);

    await runWizardTool(
      {
        id: "call-2",
        name: "update_transaction",
        args: { id, quantity: 20, unit_price: 25_000 },
      },
      state,
      noDatabase,
    );

    expect(state.proposals.get(id)).toMatchObject({
      kind: "update",
      after: { id, amount: 500_000, category: "Sales" },
    });
  });

  it("keeps the stored amount when only another field changes", async () => {
    const state = emptyState();
    state.knownRows.set(id, before);

    await runWizardTool(
      {
        id: "call-3",
        name: "update_transaction",
        args: { id, description: "Penjualan sore" },
      },
      state,
      noDatabase,
    );

    expect(state.proposals.get(id)).toMatchObject({
      after: { amount: 500_000, description: "Penjualan sore" },
    });
  });
});
