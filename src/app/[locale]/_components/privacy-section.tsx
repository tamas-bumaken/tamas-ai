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
      className="py-20 scroll-mt-16 bg-muted/50 sm:py-28">
      <div className="px-4 mx-auto max-w-6xl sm:px-6">
        <div className="flex flex-col gap-5 max-w-2xl">
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
                // Hover: kilau hijau lembut menyapu dari kiri ke kanan dan halo melebar, seperti pada tombol.
                className="group p-6 rounded-2xl bg-card ring-1 ring-foreground/10
                  bg-[linear-gradient(110deg,transparent_40%,color-mix(in_oklch,var(--primary)_12%,transparent)_50%,transparent_60%)] bg-size-[250%_100%] bg-position-[100%_0] bg-no-repeat
                  transition-all duration-500 ease-out hover:bg-position-[0%_0] hover:ring-1 hover:ring-primary/15
                  motion-reduce:transition-none motion-reduce:bg-none">
                <h3 className="flex items-center gap-2 text-xl font-semibold">
                  <Icon
                    aria-hidden
                    className="size-5 text-primary-ink transition-transform duration-300 motion-reduce:transition-none group-hover:scale-125"
                  />
                  {tModes(`${mode}.name`)}
                </h3>
                <p className="mt-1 text-base font-medium text-primary-ink">
                  {tModes(`${mode}.description`)}
                </p>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {t(`modes.${mode}`)}
                </p>
              </li>
            );
          })}
        </ul>

        {/* Jaminan keamanan dalam satu panel */}
        <dl className="grid mt-12 overflow-hidden rounded-2xl bg-primary/5  transition-shadow duration-500 motion-reduce:transition-none hover:ring-1 hover:ring-primary/15 md:grid-cols-3">
          {TRUST_FACT_KEYS.map((key, index) => {
            const FactIcon = FACT_ICONS[index % FACT_ICONS.length];

            return (
              <div
                key={key}
                // Hover: kilau menyapu di dalam poin yang disorot dan latarnya sedikit lebih pekat.
                className="group flex flex-col gap-3 p-6 border-t border-primary/15 first:border-t-0 sm:p-7 md:border-t-0 md:border-l md:first:border-l-0
                  bg-[linear-gradient(110deg,transparent_40%,color-mix(in_oklch,var(--primary)_16%,transparent)_50%,transparent_60%)] bg-size-[250%_100%] bg-position-[100%_0] bg-no-repeat
                  transition-[background-position,background-color] duration-500 ease-out hover:bg-primary/5 hover:bg-position-[0%_0]
                  motion-reduce:transition-none motion-reduce:bg-none">
                <FactIcon
                  aria-hidden
                  className="size-6 text-primary-ink transition-transform duration-300 motion-reduce:transition-none group-hover:scale-110 group-hover:-rotate-6"
                />
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
