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
    monthlyIncome: 10_000_000,
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
        category: { enum: expect.arrayContaining(["Food", "Installments"]) },
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
            category: "Food",
            amount: 32000,
            description: "KOPI kenangan",
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
        keywords: ["kopi", "coffee"],
        exclude_keywords: ["kopiah"],
        type: "expense",
      }),
      client,
    );

    expect(rpc).toHaveBeenCalledWith("aggregate_transactions", {
      start_date: "2026-10-01",
      end_date: "2026-10-31",
      keywords: ["kopi", "coffee"],
      category_filter: null,
      type_filter: "expense",
      exclude_keywords: ["kopiah"],
    });
    // 1–23 October has 23 days so far: 75,000 / 23 = 3,260.87 → 3,261; 75,000 is 0.75% of 10,000,000 → 0.7.
    expect(response.response?.output).toMatchObject({
      days_counted: 23,
      totals: [
        {
          type: "expense",
          total: 75_000,
          transaction_count: 3,
          daily_average: 3_261,
          percent_of_monthly_income: 0.7,
        },
      ],
      largest_matches: [{ description: "KOPI kenangan", amount: 32_000 }],
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
        category: "Food",
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
        category: "Food",
      }),
      client,
    );

    expect(response.response).toEqual({
      error: "Failed to load the user's transactions.",
    });
  });
});

describe("get_spending_summary", () => {
  const summaryCall = (args: Record<string, unknown>): FunctionCall => ({
    id: "call-2",
    name: "get_spending_summary",
    args,
  });

  const october: RpcResult = {
    data: [
      {
        type: "income",
        category: "Salary",
        total: 10_000_000,
        transaction_count: 1,
      },
      {
        type: "expense",
        category: "Food",
        total: 717_000,
        transaction_count: 27,
      },
      {
        type: "expense",
        category: "Shopping",
        total: 2_000_000,
        transaction_count: 2,
      },
    ],
    error: null,
  };
  const september: RpcResult = {
    data: [
      {
        type: "income",
        category: "Salary",
        total: 10_000_000,
        transaction_count: 1,
      },
      {
        type: "expense",
        category: "Food",
        total: 900_000,
        transaction_count: 30,
      },
      {
        type: "expense",
        category: "Transportation",
        total: 150_000,
        transaction_count: 6,
      },
    ],
    error: null,
  };

  type SummaryOutput = {
    days_counted: number;
    daily_average_expense: number | null;
    total_expense_percent_of_monthly_income: number | null;
    categories: {
      category: string;
      daily_average: number | null;
      percent_of_monthly_income: number | null;
    }[];
    comparison?: {
      changes: {
        total_expense: { difference: number; percent_change: number | null };
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

  it("returns income shares and daily averages instead of leaving them to the model", async () => {
    const { client } = fakeClient(october);

    const response = await runPersonalTool(
      summaryCall({ start_date: "2026-10-01", end_date: "2026-10-31" }),
      client,
    );
    const output = response.response?.output as SummaryOutput;

    // The month is counted up to today (23 days), not all 31: 2,717,000 / 23 = 118,130.4.
    expect(output.days_counted).toBe(23);
    expect(output.daily_average_expense).toBe(118_130);
    expect(output.total_expense_percent_of_monthly_income).toBe(27.1);
    expect(
      output.categories.find((row) => row.category === "Food"),
    ).toMatchObject({
      daily_average: 31_174,
      percent_of_monthly_income: 7.1,
    });
    expect(
      output.categories.find((row) => row.category === "Salary")
        ?.percent_of_monthly_income,
    ).toBeNull();
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
    // 2,717,000 vs 1,050,000.
    expect(changes?.total_expense).toEqual({
      difference: 1_667_000,
      percent_change: 158.7,
    });
    expect(changes?.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "Food",
          difference: -183_000,
          percent_change: -20.3,
        }),
        // New this month: no percentage against zero.
        expect.objectContaining({
          category: "Shopping",
          previous_total: 0,
          percent_change: null,
        }),
        // Gone this month, but still listed.
        expect.objectContaining({
          category: "Transportation",
          total: 0,
          difference: -150_000,
          percent_change: -100,
        }),
      ]),
    );
  });

  it("leaves the income share empty for a range longer than one month", async () => {
    const { client } = fakeClient(october);

    const response = await runPersonalTool(
      summaryCall({ start_date: "2026-09-01", end_date: "2026-10-31" }),
      client,
    );

    expect(
      (response.response?.output as SummaryOutput)
        .total_expense_percent_of_monthly_income,
    ).toBeNull();
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
