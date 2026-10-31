import Link from "next/link";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";

// Required before the beta opens (decision 2026-10-23): AI runs on Gemini's free tier, whose terms let Google use the
// content to improve its products. Sample data is recommended, not required, so real usage can still be measured.
export function BetaAiNotice() {
  const t = useTranslations("betaAiNotice");

  return (
    <p className="flex gap-2 p-3 text-xs leading-5 rounded-md bg-muted text-muted-foreground">
      <InfoIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <span>
        {t("body")}{" "}
        <Link
          href="/privacy"
          className="font-medium underline underline-offset-2 hover:text-foreground"
        >
          {t("link")}
        </Link>
      </span>
    </p>
  );
}
