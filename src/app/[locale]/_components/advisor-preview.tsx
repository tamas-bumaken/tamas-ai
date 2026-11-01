import { useTranslations } from "next-intl";
import { BotIcon } from "lucide-react";
import { CHAT_MODES } from "@/constans/chat-modes";
import {
  SAMPLE_MONTH,
  businessCosts,
  cashLeft,
  ownerTaken,
  profit,
} from "../_data/sample-month";
import { formatIDR } from "../_lib/format-idr";

// A static replica of the dashboard's AI Advisor drawer, using the same bubble and label styles.
export function AdvisorPreview() {
  const t = useTranslations("landing.preview");
  const tModes = useTranslations("chatModes");
  const tCategories = useTranslations("categories");
  const PersonalIcon = CHAT_MODES.personal.Icon;

  return (
    <figure>
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
          <p className="text-base font-semibold">AI Advisor</p>
          <p className="flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-full bg-muted">
            <PersonalIcon aria-hidden className="size-3.5 text-primary-ink" />
            {tModes("personal.description")}
          </p>
        </div>
        <div className="flex flex-col gap-5 p-4 sm:p-5">
          <p className="self-end max-w-[85%] px-4 py-2.5 text-base text-primary-foreground rounded-2xl rounded-br-md bg-primary motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:fill-mode-both">
            {tModes("personal.suggestions.q2")}
          </p>
          <div className="flex flex-col gap-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-500 motion-safe:fill-mode-both">
            <p className="flex items-center gap-1.5 text-xs font-medium text-primary-ink">
              <BotIcon aria-hidden className="size-4" />
              AI Advisor
            </p>
            <div className="text-base leading-7 response-ai">
              <p>
                {t.rich("answerTop", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                  taken: formatIDR(ownerTaken),
                  profit: formatIDR(profit),
                })}
              </p>
              <ul>
                {[SAMPLE_MONTH.ownerWithdrawal, SAMPLE_MONTH.ceremony].map(
                  (category) => (
                    <li key={category.name} className="tabular-nums">
                      {tCategories(category.name)} {formatIDR(category.amount)}
                    </li>
                  ),
                )}
              </ul>
              <p>{t("answerBottom", { cashLeft: formatIDR(cashLeft) })}</p>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="px-1 pt-3 text-sm text-muted-foreground">
        {t("caption", {
          sales: formatIDR(SAMPLE_MONTH.sales),
          costs: formatIDR(businessCosts),
        })}
      </figcaption>
    </figure>
  );
}
