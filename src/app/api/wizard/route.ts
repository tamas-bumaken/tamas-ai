import {
  createUsageTotals,
  finishAiRequest,
  isAiServiceBusy,
  startAiRequest,
} from "@/lib/ai-usage";
import { getCookieTranslations } from "@/i18n/server";
import { getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { WizardResult } from "@/types/wizard";
import { chatbotFormSchema } from "@/validations/chatbot-validations";
import { MAX_TRANSACTIONS_PER_MESSAGE } from "@/validations/wizard-validations";
import {
  handleWizardInput,
  InvalidWizardTransactionError,
  WIZARD_MODEL,
} from "./handle-wizard-input";

export async function POST(request: Request) {
  const t = await getCookieTranslations("apiErrors");

  // Checked first: every request past this point spends Gemini tokens.
  if (!(await getUserId())) {
    return Response.json({ error: t("unauthorized") }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = chatbotFormSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: t("invalidRequest") }, { status: 400 });
  }

  // After validation, so a malformed body does not use up the user's quota.
  const supabase = await createClient();
  const quota = await startAiRequest(supabase, "wizard", WIZARD_MODEL);

  if (!quota.allowed) {
    return Response.json({ error: quota.message }, { status: quota.status });
  }

  const usage = createUsageTotals();
  let result: WizardResult;

  try {
    result = await handleWizardInput(parsed.data.message, usage);
  } catch (error) {
    if (error instanceof InvalidWizardTransactionError) {
      const message =
        error.reason === "too_many"
          ? t("wizardTooMany", { max: MAX_TRANSACTIONS_PER_MESSAGE })
          : t("wizardNothingFound");
      return Response.json({ error: message }, { status: 422 });
    }

    if (isAiServiceBusy(error)) {
      return Response.json({ error: t("busyWizard") }, { status: 503 });
    }

    // Creates run between Gemini calls, so this covers model and database failures alike.
    console.error("[api/wizard] processing failed", error);
    return Response.json({ error: t("wizardFailed") }, { status: 500 });
  } finally {
    await finishAiRequest(supabase, quota.requestId, usage);
  }

  return Response.json(result);
}
