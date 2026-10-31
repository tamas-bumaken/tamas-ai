import { addUsage, AiUsageTotals } from "@/lib/ai-usage";
import { getTodayInJakarta } from "@/lib/dates";
import { ai } from "@/lib/genai";
import { createClient } from "@/lib/supabase/server";
import { WizardResult } from "@/types/wizard";
import { formatCategoriesForPrompt } from "@/constans/transaction-categories";
import { MAX_TRANSACTIONS_PER_MESSAGE } from "@/validations/wizard-validations";
import { Content, FunctionCallingConfigMode } from "@google/genai";
import {
  getWizardToolDeclarations,
  MUTATING_TOOL_NAMES,
  runWizardTool,
  SEARCH_TOOL_NAME,
  WizardRunState,
} from "./wizard-tools";

// Thrown when the model succeeded but the text did not describe anything the wizard can do.
// The route words the reason in the user's language.
export class InvalidWizardTransactionError extends Error {
  constructor(readonly reason: "too_many" | "nothing_found") {
    super(reason);
  }
}

export const WIZARD_MODEL = "gemini-3.6-flash";

// Bounds the Gemini calls one message can trigger: a search round, an action round, and one retry.
const MAX_TOOL_ROUNDS = 3;

function buildSystemInstruction(): string {
  return `
  <role>
    You are an AI Wizard finance assistant that records, changes, and removes the user's transactions by calling functions.
  </role>
  <instruction>
    For every new transaction in the text, call create_transaction with these arguments:
    - "amount": a positive number. Read shorthand such as "20rb" or "20k" as 20000 and "1,5jt" as 1500000.
    - "type": 'income' for money received, 'expense' for money spent.
    - "category": the most appropriate category listed for the transaction's type, written exactly as below:
${formatCategoriesForPrompt()}
    - "description": a short string describing the transaction, first letter capitalized.
    - "date": date of the transaction in YYYY-MM-DD format. Resolve relative terms such as 'today', 'yesterday', or 'kemarin' against the current date; if no date is given, use the current date.
    To change or remove an existing transaction, first call search_transactions, then call update_transaction or delete_transaction with the id of the matching result. Use the dates in the text to narrow the search.
    Never guess: if no search result clearly matches, or several match equally well, do not call update_transaction or delete_transaction.
    If the text does not describe anything to record, change, or remove, or gives no amount for a new transaction, do not call any function; reply with one short sentence instead.
  </instruction>
  <context>
    Current Date: ${getTodayInJakarta()}
  </context>
  `;
}

// Nothing is stored here: new transactions come back as drafts the user reviews and saves (createTransactions),
// updates and deletes as proposals the user confirms.
// Token counts of every Gemini call are added to `usage`, also when the request fails halfway.
export async function handleWizardInput(
  message: string,
  usage: AiUsageTotals,
): Promise<WizardResult> {
  const supabase = await createClient();
  const systemInstruction = buildSystemInstruction();
  const state: WizardRunState = {
    knownRows: new Map(),
    drafts: [],
    proposals: new Map(),
  };
  // Kept apart from the instruction so text in the message cannot pass itself off as part of the prompt.
  const contents: Content[] = [{ role: "user", parts: [{ text: message }] }];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await ai.models.generateContent({
      model: WIZARD_MODEL,
      contents,
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: getWizardToolDeclarations(
              round < MAX_TOOL_ROUNDS - 1,
            ),
          },
        ],
        // AUTO rather than ANY: a forced call would make the model invent a transaction for unrelated text.
        toolConfig: {
          functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
        },
      },
    });

    addUsage(usage, response.usageMetadata);

    const modelContent = response.candidates?.[0]?.content;
    const functionCalls = response.functionCalls ?? [];
    if (!modelContent || functionCalls.length === 0) break;

    const actionCount =
      state.drafts.length +
      state.proposals.size +
      functionCalls.filter(({ name }) =>
        MUTATING_TOOL_NAMES.includes(name ?? ""),
      ).length;

    // Checked before any call runs, so an oversized message saves nothing instead of a partial list.
    if (actionCount > MAX_TRANSACTIONS_PER_MESSAGE) {
      throw new InvalidWizardTransactionError("too_many");
    }

    const functionResponses = await Promise.all(
      functionCalls.map((call) => runWizardTool(call, state, supabase)),
    );

    // Another round is only worth a Gemini call when the model has search results to act on or errors to fix.
    const needsFollowUp =
      functionCalls.some(({ name }) => name === SEARCH_TOOL_NAME) ||
      functionResponses.some(({ response }) => response?.error !== undefined);
    if (!needsFollowUp) break;

    contents.push(
      // The whole model turn is resent: Gemini 3 rejects a follow-up whose thought signatures were dropped.
      modelContent,
      {
        role: "user",
        parts: functionResponses.map((functionResponse) => ({
          functionResponse,
        })),
      },
    );
  }

  if (state.drafts.length === 0 && state.proposals.size === 0) {
    throw new InvalidWizardTransactionError("nothing_found");
  }

  return {
    drafts: state.drafts,
    proposals: [...state.proposals.values()],
  };
}
