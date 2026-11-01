import { useTranslations } from "next-intl";
import { EyeOffIcon, LockKeyholeIcon, ShieldCheckIcon } from "lucide-react";
import { CHAT_MODES } from "@/constans/chat-modes";
import { ChatMode } from "@/validations/chatbot-validations";
import { TRUST_FACT_KEYS } from "../_data/privacy";

// Ikon untuk tiap poin kepercayaan, dipakai berurutan sesuai TRUST_FACT_KEYS.
const FACT_ICONS = [ShieldCheckIcon, LockKeyholeIcon, EyeOffIcon];

export function PrivacySection() {
  const t = useTranslations("landing.privacy");
  const tModes = useTranslations("chatModes");

  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="relative overflow-hidden py-20 scroll-mt-16 bg-muted/50 sm:py-28">
      {/* Perisai besar sebagai latar, hanya dekorasi */}
      <ShieldCheckIcon
        aria-hidden
        strokeWidth={1}
        className="absolute hidden -right-10 -top-6 size-72 text-primary/10 lg:block"
      />

      <div className="relative px-4 mx-auto max-w-6xl sm:px-6">
        <div className="flex flex-col gap-5 max-w-2xl">
          <span
            aria-hidden
            className="flex items-center justify-center size-12 rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheckIcon className="size-6" />
          </span>
          <h2
            id="privacy-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">{t("body")}</p>
        </div>

        {/* Mode chat */}
        <ul className="grid gap-4 mt-12 md:grid-cols-2">
          {(Object.keys(CHAT_MODES) as ChatMode[]).map((mode) => {
            const { Icon } = CHAT_MODES[mode];

            return (
              <li
                key={mode}
                className="flex gap-4 p-6 rounded-2xl bg-card ring-1 ring-foreground/10 shadow-sm">
                <span
                  aria-hidden
                  className="flex items-center justify-center shrink-0 size-12 rounded-xl bg-primary/10">
                  <Icon className="size-6 text-primary-ink" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold">
                    {tModes(`${mode}.name`)}
                  </h3>
                  <p className="mt-1 text-base font-medium text-primary-ink">
                    {tModes(`${mode}.description`)}
                  </p>
                  <p className="mt-3 text-base leading-7 text-muted-foreground">
                    {t(`modes.${mode}`)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Jaminan keamanan dalam satu panel */}
        <dl className="grid mt-12 overflow-hidden rounded-2xl bg-primary/5 ring-1 ring-primary/20 md:grid-cols-3">
          {TRUST_FACT_KEYS.map((key, index) => {
            const FactIcon = FACT_ICONS[index % FACT_ICONS.length];

            return (
              <div
                key={key}
                className="flex flex-col gap-3 p-6 border-t border-primary/15 first:border-t-0 sm:p-7 md:border-t-0 md:border-l md:first:border-l-0">
                <FactIcon aria-hidden className="size-6 text-primary-ink" />
                <dt className="text-lg font-semibold">
                  {t(`facts.${key}.title`)}
                </dt>
                <dd className="text-base leading-7 text-muted-foreground">
                  {t(`facts.${key}.body`)}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
