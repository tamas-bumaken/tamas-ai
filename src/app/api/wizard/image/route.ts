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
import {
  detectImageMimeType,
  MAX_WIZARD_IMAGE_BYTES,
} from "@/validations/wizard-image-validations";
import { MAX_TRANSACTIONS_PER_MESSAGE } from "@/validations/wizard-validations";
import {
  handleWizardImage,
  InvalidWizardTransactionError,
  WIZARD_MODEL,
} from "../handle-wizard-input";

// The image only lives in this request: it goes to Gemini once and is never stored.
export async function POST(request: Request) {
  const t = await getCookieTranslations("apiErrors");

  // Checked first: every request past this point spends Gemini tokens.
  if (!(await getUserId())) {
    return Response.json({ error: t("unauthorized") }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("image");

  if (!(file instanceof File)) {
    return Response.json({ error: t("invalidRequest") }, { status: 400 });
  }

  if (file.size > MAX_WIZARD_IMAGE_BYTES) {
    return Response.json({ error: t("imageTooLarge") }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = detectImageMimeType(bytes);

  if (!mimeType) {
    return Response.json({ error: t("imageInvalid") }, { status: 415 });
  }

  // After validation, so an unusable file does not use up the user's quota.
  const supabase = await createClient();
  const quota = await startAiRequest(supabase, "wizard", WIZARD_MODEL);

  if (!quota.allowed) {
    return Response.json({ error: quota.message }, { status: quota.status });
  }

  const usage = createUsageTotals();
  let result: WizardResult;

  try {
    result = await handleWizardImage(
      { mimeType, data: bytes.toString("base64") },
      usage,
    );
  } catch (error) {
    if (error instanceof InvalidWizardTransactionError) {
      const message =
        error.reason === "too_many"
          ? t("imageTooMany", { max: MAX_TRANSACTIONS_PER_MESSAGE })
          : t("imageNothingFound");
      return Response.json({ error: message }, { status: 422 });
    }

    if (isAiServiceBusy(error)) {
      return Response.json({ error: t("busyWizard") }, { status: 503 });
    }

    console.error("[api/wizard/image] processing failed", error);
    return Response.json({ error: t("imageFailed") }, { status: 500 });
  } finally {
    await finishAiRequest(supabase, quota.requestId, usage);
  }

  return Response.json(result);
}
