import { useTranslations } from "next-intl";
import { BotIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SHOPPING_TRIM, saved } from "../_data/sample-month";
import { formatIDR } from "../_lib/format-idr";

export function ClosingCta() {
  const t = useTranslations("landing.closing");
  const tModes = useTranslations("chatModes");

  return (
    <section
      aria-labelledby="closing-heading"
      className="px-4 pb-20 mx-auto max-w-6xl sm:px-6 sm:pb-28">
      <div className="relative overflow-hidden px-6 py-14 rounded-3xl bg-primary text-primary-foreground sm:px-12 sm:py-16">
        {/* Lingkaran latar hanya di sudut kanan agar tidak menabrak teks */}
        <span
          aria-hidden
          className="absolute -top-28 -right-16 size-80 rounded-full bg-primary-foreground/10"
        />
        <span
          aria-hidden
          className="absolute -bottom-24 right-40 size-56 rounded-full bg-primary-foreground/5"
        />

        <div className="relative flex items-center justify-between gap-10">
          <div className="max-w-xl">
            <h2
              id="closing-heading"
              className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-lg leading-8 text-primary-foreground/90">
              {t("body")}
            </p>
            <Button
              asChild
              className="h-12 px-7 mt-8 text-base font-semibold shadow-lg bg-foreground text-background hover:bg-foreground/85 focus-visible:ring-foreground/40">
              <Link href="/register">{t("cta")}</Link>
            </Button>
          </div>

          {/* Mini kartu Advisor, hanya contoh tampilan */}
          <div
            aria-hidden
            className="hidden shrink-0 md:flex flex-col gap-3 w-72 p-4 mr-2 rounded-2xl bg-background text-foreground shadow-2xl ring-1 ring-foreground/10 rotate-2 lg:w-80 lg:mr-8">
            <p className="self-end max-w-[90%] px-3.5 py-2 text-sm rounded-2xl rounded-br-md bg-primary text-primary-foreground">
              {tModes("personal.suggestions.q2")}
            </p>
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary-ink">
                <BotIcon className="size-4" />
                AI Advisor
              </p>
              <p className="text-sm leading-6">
                {t.rich("mock.answer", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                  saved: formatIDR(saved),
                  trim: formatIDR(SHOPPING_TRIM),
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
