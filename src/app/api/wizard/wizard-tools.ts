import "server-only";

import { generateEmbedding } from "@/lib/embedding";
import { createClient } from "@/lib/supabase/server";
import { WizardProposal, WizardTransactionRow } from "@/types/wizard";
import {
  TransactionPayload,
  transactionPayloadSchema,
} from "@/validations/transaction-validations";
import {
  wizardDeleteArgsSchema,
  wizardSearchArgsSchema,
  wizardTransactionSchema,
  wizardUpdateArgsSchema,
} from "@/validations/wizard-validations";
import {
  FunctionCall,
  FunctionDeclaration,
  FunctionResponse,
} from "@google/genai";
import z from "zod";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Same threshold as the advisor's search: the model sees the rows and can skip borderline ones.
const SEARCH_MATCH_THRESHOLD = 0.4;
// The RPC applies its own LIMIT before the date filters, so it is asked for more rows than are returned.
const SEARCH_CANDIDATE_COUNT = 50;
const SEARCH_RESULT_LIMIT = 10;

export const SEARCH_TOOL_NAME = "search_transactions";
export const MUTATING_TOOL_NAMES = [
  "create_transaction",
  "update_transaction",
  "delete_transaction",
];

const SEARCH_DECLARATION: FunctionDeclaration = {
  name: SEARCH_TOOL_NAME,
  description:
    "Finds the user's existing transactions, either semantically closest to a query or, without a query, the latest ones. Optional dates limit the range. Returns at most 10 rows with their ids.",
  parametersJsonSchema: z.toJSONSchema(wizardSearchArgsSchema),
};

const MUTATING_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "create_transaction",
    description:
      "Prepares one new income or expense transaction, which the user reviews and saves. Call it once for every new transaction the text describes.",
    // Derived from the Zod schemas so each declaration and the validation of its arguments cannot drift apart.
    parametersJsonSchema: z.toJSONSchema(wizardTransactionSchema),
  },
  {
    name: "update_transaction",
    description:
      "Changes an existing transaction found with search_transactions. Pass its id and only the fields that change.",
    parametersJsonSchema: z.toJSONSchema(wizardUpdateArgsSchema),
  },
  {
    name: "delete_transaction",
    description:
      "Removes an existing transaction found with search_transactions.",
    parametersJsonSchema: z.toJSONSchema(wizardDeleteArgsSchema),
  },
];

// Search is left out of the last round, when its results could no longer be acted on.
export function getWizardToolDeclarations(
  canSearch: boolean,
): FunctionDeclaration[] {
  return canSearch
    ? [SEARCH_DECLARATION, ...MUTATING_DECLARATIONS]
    : MUTATING_DECLARATIONS;
}

// A photo can carry text that was written to trick the model, so it can only ever produce drafts the user reviews.
export function getWizardImageToolDeclarations(): FunctionDeclaration[] {
  return MUTATING_DECLARATIONS.filter(
    ({ name }) => name === "create_transaction",
  );
}

export type WizardRunState = {
  // Only rows the model has seen in a search may be changed, so it cannot act on an id it made up.
  knownRows: Map<string, WizardTransactionRow>;
  // New transactions are only drafted; the user reviews, edits and saves them (Phase 1 / 1.1).
  drafts: TransactionPayload[];
  // Keyed by id, so a later call on the same row replaces the earlier proposal.
  proposals: Map<string, WizardProposal>;
};

// Models never do arithmetic: "32 porsi 25rb" arrives as a quantity and a unit price, and the total is computed here,
// rounded to whole rupiah. Without both, the fields pass through and transactionPayloadSchema decides if an amount is missing.
function withComputedAmount({
  quantity,
  unit_price,
  ...fields
}: Partial<z.infer<typeof wizardTransactionSchema>>) {
  return quantity !== undefined && unit_price !== undefined
    ? { ...fields, amount: Math.round(quantity * unit_price) }
    : fields;
}

const transactionRowSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  type: z.enum(["income", "expense"]),
  category: z.string(),
  description: z
    .string()
    .nullable()
    .transform((description) => description ?? ""),
  date: z.string(),
});

async function searchTransactions(
  { query, start_date, end_date }: z.infer<typeof wizardSearchArgsSchema>,
  supabase: SupabaseClient,
): Promise<WizardTransactionRow[]> {
  let request = query
    ? supabase.rpc("match_transactions", {
        query_embedding: await generateEmbedding(query),
        match_threshold: SEARCH_MATCH_THRESHOLD,
        match_count: SEARCH_CANDIDATE_COUNT,
      })
    : supabase
        .from("transactions")
        .select("id, amount, type, category, description, date")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

  if (start_date) request = request.gte("date", start_date);
  if (end_date) request = request.lte("date", end_date);

  const { data, error } = await request.limit(SEARCH_RESULT_LIMIT);
  if (error) throw new Error(error.message);

  return z.array(transactionRowSchema).parse(data);
}

// Invalid arguments go back to the model so it can correct them; database failures abort the whole request.
// The supabase client must carry the user's session: RLS is what limits every query to their own rows.
export async function runWizardTool(
  call: FunctionCall,
  state: WizardRunState,
  supabase: SupabaseClient,
): Promise<FunctionResponse> {
  const respond = (response: Record<string, unknown>): FunctionResponse => ({
    id: call.id,
    name: call.name,
    response,
  });

  const invalidArgs = (message: string) =>
    respond({ error: `Invalid arguments: ${message}` });

  const unknownId = () =>
    respond({
      error:
        "Unknown transaction id. Call search_transactions and use an id from its results.",
    });

  switch (call.name) {
    case SEARCH_TOOL_NAME: {
      const args = wizardSearchArgsSchema.safeParse(call.args);
      if (!args.success) return invalidArgs(z.prettifyError(args.error));

      const rows = await searchTransactions(args.data, supabase);
      for (const row of rows) state.knownRows.set(row.id, row);

      return respond({ output: { transactions: rows } });
    }
    case "create_transaction": {
      const args = wizardTransactionSchema.safeParse(call.args);
      if (!args.success) return invalidArgs(z.prettifyError(args.error));

      // Same rules the action enforces, checked first so the model gets to fix a violation instead of the request failing.
      const payload = transactionPayloadSchema.safeParse(
        withComputedAmount(args.data),
      );
      if (!payload.success) return invalidArgs(z.prettifyError(payload.error));

      // The parsed payload, not the raw args: the review card shows exactly what would be saved.
      state.drafts.push(payload.data);

      return respond({ output: { status: "drafted_for_user_review" } });
    }
    case "update_transaction": {
      const args = wizardUpdateArgsSchema.safeParse(call.args);
      if (!args.success) return invalidArgs(z.prettifyError(args.error));

      const { id, ...changes } = args.data;
      const before = state.knownRows.get(id);
      if (!before) return unknownId();

      // The merged row is what updateTransaction will receive on confirm, so it is checked against the same rules now.
      const payload = transactionPayloadSchema.safeParse({
        ...before,
        ...withComputedAmount(changes),
      });
      if (!payload.success) return invalidArgs(z.prettifyError(payload.error));

      state.proposals.set(id, {
        kind: "update",
        before,
        after: { id, ...payload.data },
      });

      return respond({ output: { status: "awaiting_user_confirmation" } });
    }
    case "delete_transaction": {
      const args = wizardDeleteArgsSchema.safeParse(call.args);
      if (!args.success) return invalidArgs(z.prettifyError(args.error));

      const transaction = state.knownRows.get(args.data.id);
      if (!transaction) return unknownId();

      state.proposals.set(transaction.id, { kind: "delete", transaction });

      return respond({ output: { status: "awaiting_user_confirmation" } });
    }
    default:
      return respond({ error: `Unknown tool: ${call.name}` });
  }
}
