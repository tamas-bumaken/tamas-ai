import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { FAQ_KEYS } from "../_data/faqs";

export function Faq() {
  const t = useTranslations("landing.faq");

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-20 scroll-mt-16 sm:py-28"
    >
      <div className="grid gap-10 px-4 mx-auto max-w-6xl sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <h2
          id="faq-heading"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {t("title")}
        </h2>
        <div className="divide-y divide-foreground/10 border-y border-foreground/10">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="group">
              <summary className="flex items-center justify-between gap-4 py-5 text-lg font-medium rounded-md cursor-pointer list-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                {t(`items.${key}.question`)}
                <ChevronDownIcon
                  aria-hidden
                  className="size-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none group-open:rotate-180"
                />
              </summary>
              <p className="pb-5 pr-9 text-base leading-7 text-muted-foreground max-w-prose">
                {t(`items.${key}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
