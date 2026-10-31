import { FunctionCall } from "@google/genai";
import { describe, expect, it, vi } from "vitest";

// Search needs a Gemini embedding; these tests only cover the SQL-backed tools.
vi.mock("@/lib/embedding", () => ({ generateEmbedding: vi.fn() }));

const { PERSONAL_TOOL_DECLARATIONS, runPersonalTool } =
  await import("./personal-tools");

type PersonalToolContext = Parameters<typeof runPersonalTool>[1];
type RpcResult = { data: unknown; error: { message: string } | null };

const TODAY = "2026-10-23";

// Only rpc() is used, so the fake implements just that; the cast keeps the real client type in the context.
// Each call gets the next result, so a summary with a comparison can return two periods.
function fakeClient(...results: RpcResult[]) {
  const rpc = vi.fn();
  for (const result of results) rpc.mockResolvedValueOnce(result);

  const client: PersonalToolContext = {
    supabase: { rpc } as unknown as PersonalToolContext["supabase"],
    today: TODAY,
  };
  return { client, rpc };
}

function call(args: Record<string, unknown>): FunctionCall {
  return { id: "call-1", name: "get_filtered_total", args };
}

describe("get_filtered_total", () => {
  it("is declared to the model with its filters", () => {
    const declaration = PERSONAL_TOOL_DECLARATIONS.find(
      ({ name }) => name === "get_filtered_total",
    );

    expect(declaration?.parametersJsonSchema).toMatchObject({
      type: "object",
      required: ["start_date", "end_date"],
      properties: {
        keywords: { type: "array" },
        exclude_keywords: { type: "array" },
        category: {
          enum: expect.arrayContaining(["Raw Materials", "Ceremony & Adat"]),
        },
        type: { enum: ["income", "expense"] },
      },
    });
  });

  it("passes the filters to aggregate_transactions and returns its totals", async () => {
    const { client, rpc } = fakeClient({
      data: {
        totals: [{ type: "expense", total: "75000", transaction_count: 3 }],
        largest_matches: [
          {
            type: "expense",
            category: "Raw Materials",
            amount: 32000,
            description: "AYAM potong",
            date: "2026-10-20",
          },
        ],
      },
      error: null,
    });

    const response = await runPersonalTool(
      call({
        start_date: "2026-10-01",
        end_date: "2026-10-31",
        keywords: ["ayam", "chicken"],
        exclude_keywords: ["ayaman"],
        type: "expense",
      }),
      client,
    );

    expect(rpc).toHaveBeenCalledWith("aggregate_transactions", {
      start_date: "2026-10-01",
      end_date: "2026-10-31",
      keywords: ["ayam", "chicken"],
      category_filter: null,
      type_filter: "expense",
      exclude_keywords: ["ayaman"],
    });
    // 1–23 October has 23 days so far: 75,000 / 23 = 3,260.87 → 3,261.
    expect(response.response?.output).toMatchObject({
      days_counted: 23,
      totals: [
        {
          type: "expense",
          total: 75_000,
          transaction_count: 3,
          daily_average: 3_261,
        },
      ],
      largest_matches: [{ description: "AYAM potong", amount: 32_000 }],
    });
  });

  it("asks the model for keywords or a category instead of querying everything", async () => {
    const { client, rpc } = fakeClient({ data: null, error: null });

    const response = await runPersonalTool(
      call({ start_date: "2026-10-01", end_date: "2026-10-31" }),
      client,
    );

    expect(rpc).not.toHaveBeenCalled();
    expect(response.response?.error).toContain("Pass keywords or a category");
  });

  it("rejects a range that ends before it starts", async () => {
    const { client, rpc } = fakeClient({ data: null, error: null });

    const response = await runPersonalTool(
      call({
        start_date: "2026-10-31",
        end_date: "2026-10-01",
        category: "Raw Materials",
      }),
      client,
    );

    expect(rpc).not.toHaveBeenCalled();
    expect(response.response?.error).toContain("start_date");
  });

  it("reports a database failure without inventing a number", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeClient({
      data: null,
      error: { message: "function aggregate_transactions does not exist" },
    });

    const response = await runPersonalTool(
      call({
        start_date: "2026-10-01",
        end_date: "2026-10-31",
        category: "Raw Materials",
      }),
      client,
    );

    expect(response.response).toEqual({
      error: "Failed to load the user's transactions.",
    });
  });
});

describe("get_business_summary", () => {
  const summaryCall = (args: Record<string, unknown>): FunctionCall => ({
    id: "call-2",
    name: "get_business_summary",
    args,
  });

  const row = (
    type: "income" | "expense",
    category: string,
    total: number,
  ) => ({
    type,
    category,
    total,
    transaction_count: 1,
  });

  const october: RpcResult = {
    data: [
      row("income", "Sales", 10_000_000),
      row("income", "Owner Capital", 1_000_000),
      row("expense", "Raw Materials", 4_000_000),
      row("expense", "Staff Wages", 1_000_000),
      row("expense", "Owner Withdrawal", 2_000_000),
      row("expense", "Ceremony & Adat", 1_500_000),
      row("expense", "Loan Installments", 500_000),
    ],
    error: null,
  };
  const september: RpcResult = {
    data: [
      row("income", "Sales", 8_000_000),
      row("expense", "Raw Materials", 4_000_000),
      row("expense", "Transport & Delivery", 500_000),
      row("expense", "Owner Withdrawal", 1_000_000),
    ],
    error: null,
  };

  type SummaryOutput = {
    days_counted: number;
    business_income: number;
    business_expense: number;
    profit: number;
    profit_margin_percent: number | null;
    owner_taken: number;
    owner_withdrawals: number;
    ceremony: number;
    owner_taken_percent_of_profit: number | null;
    owner_capital: number;
    loan_installments: number;
    cash_left: number;
    daily_average_business_income: number | null;
    daily_average_business_expense: number | null;
    categories: {
      category: string;
      group: string;
      daily_average: number | null;
      percent_of_type_total: number | null;
      percent_of_business_income: number | null;
    }[];
    comparison?: {
      changes: {
        profit: { difference: number; percent_change: number | null };
        owner_taken: { difference: number; percent_change: number | null };
        cash_left: { difference: number; percent_change: number | null };
        categories: {
          category: string;
          total: number;
          previous_total: number;
          difference: number;
          percent_change: number | null;
        }[];
      };
    };
  };

  async function summarize(...results: RpcResult[]) {
    const { client, rpc } = fakeClient(...results);
    const response = await runPersonalTool(
      summaryCall({ start_date: "2026-10-01", end_date: "2026-10-31" }),
      client,
    );

    return { output: response.response?.output as SummaryOutput, rpc };
  }

  it("returns the profit instead of leaving it to the model", async () => {
    const { output } = await summarize(october);

    expect(output).toMatchObject({
      business_income: 10_000_000,
      business_expense: 5_000_000,
      profit: 5_000_000,
      profit_margin_percent: 50,
    });
  });

  it("separates what the owner took and shows it against the profit", async () => {
    const { output } = await summarize(october);

    expect(output).toMatchObject({
      owner_withdrawals: 2_000_000,
      ceremony: 1_500_000,
      owner_taken: 3_500_000,
      owner_taken_percent_of_profit: 70,
    });
  });

  it("returns the cash left with capital and loan payments apart", async () => {
    const { output } = await summarize(october);

    expect(output).toMatchObject({
      owner_capital: 1_000_000,
      loan_installments: 500_000,
      cash_left: 2_000_000,
    });
  });

  it("averages only over the days that have passed", async () => {
    const { output } = await summarize(october);

    // The month is counted up to today (23 days): 10,000,000 / 23 = 434,782.6; 5,000,000 / 23 = 217,391.3.
    expect(output.days_counted).toBe(23);
    expect(output.daily_average_business_income).toBe(434_783);
    expect(output.daily_average_business_expense).toBe(217_391);
  });

  it("labels each category and shows costs as a share of business income", async () => {
    const { output } = await summarize(october);
    const rawMaterials = output.categories.find(
      (category) => category.category === "Raw Materials",
    );
    const ceremony = output.categories.find(
      (category) => category.category === "Ceremony & Adat",
    );

    expect(rawMaterials).toMatchObject({
      group: "business_expense",
      percent_of_business_income: 40,
    });
    expect(ceremony).toMatchObject({
      group: "owner_taken",
      percent_of_business_income: 15,
    });
  });

  it("has no share of profit when the business made none", async () => {
    const { output } = await summarize({
      data: [
        row("income", "Sales", 1_000_000),
        row("expense", "Raw Materials", 1_500_000),
        row("expense", "Owner Withdrawal", 200_000),
      ],
      error: null,
    });

    expect(output.profit).toBe(-500_000);
    expect(output.owner_taken_percent_of_profit).toBeNull();
  });

  it("computes the differences when asked to compare two periods", async () => {
    const { client, rpc } = fakeClient(october, september);

    const response = await runPersonalTool(
      summaryCall({
        start_date: "2026-10-01",
        end_date: "2026-10-31",
        compare_start_date: "2026-09-01",
        compare_end_date: "2026-09-30",
      }),
      client,
    );
    const changes = (response.response?.output as SummaryOutput).comparison
      ?.changes;

    expect(rpc).toHaveBeenCalledTimes(2);
    // Profit 5,000,000 vs 3,500,000.
    expect(changes?.profit).toEqual({
      difference: 1_500_000,
      percent_change: 42.8,
    });
    // Taken 3,500,000 vs 1,000,000.
    expect(changes?.owner_taken).toEqual({
      difference: 2_500_000,
      percent_change: 250,
    });
    expect(changes?.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "Raw Materials",
          difference: 0,
          percent_change: 0,
        }),
        // New this month: no percentage against zero.
        expect.objectContaining({
          category: "Staff Wages",
          previous_total: 0,
          percent_change: null,
        }),
        // Gone this month, but still listed.
        expect.objectContaining({
          category: "Transport & Delivery",
          total: 0,
          difference: -500_000,
          percent_change: -100,
        }),
      ]),
    );
  });

  it("asks for both comparison dates", async () => {
    const { client, rpc } = fakeClient(october);

    const response = await runPersonalTool(
      summaryCall({
        start_date: "2026-10-01",
        end_date: "2026-10-31",
        compare_start_date: "2026-09-01",
      }),
      client,
    );

    expect(rpc).not.toHaveBeenCalled();
    expect(response.response?.error).toContain("compare_end_date");
  });
});
