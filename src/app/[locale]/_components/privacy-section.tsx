import { useTranslations } from "next-intl";
import { CHAT_MODES } from "@/constans/chat-modes";
import { ChatMode } from "@/validations/chatbot-validations";
import { TRUST_FACT_KEYS } from "../_data/privacy";

export function PrivacySection() {
  const t = useTranslations("landing.privacy");
  const tModes = useTranslations("chatModes");

  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="py-20 scroll-mt-16 bg-muted/50 sm:py-28"
    >
      <div className="px-4 mx-auto max-w-6xl sm:px-6">
        <div className="max-w-2xl">
          <h2
            id="privacy-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {t("body")}
          </p>
        </div>
        <ul className="grid gap-4 mt-12 md:grid-cols-2">
          {(Object.keys(CHAT_MODES) as ChatMode[]).map((mode) => {
            const { Icon } = CHAT_MODES[mode];

            return (
              <li
                key={mode}
                className="p-6 rounded-2xl bg-card ring-1 ring-foreground/10"
              >
                <h3 className="flex items-center gap-2 text-xl font-semibold">
                  <Icon aria-hidden className="size-5 text-primary-ink" />
                  {tModes(`${mode}.name`)}
                </h3>
                <p className="mt-1 text-base font-medium">
                  {tModes(`${mode}.description`)}
                </p>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {t(`modes.${mode}`)}
                </p>
              </li>
            );
          })}
        </ul>
        <dl className="grid gap-8 mt-14 md:grid-cols-3 md:gap-10">
          {TRUST_FACT_KEYS.map((key) => (
            <div key={key} className="pt-5 border-t border-foreground/15">
              <dt className="text-lg font-semibold">
                {t(`facts.${key}.title`)}
              </dt>
              <dd className="mt-2 text-base leading-7 text-muted-foreground">
                {t(`facts.${key}.body`)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
