import { useTranslations } from "next-intl";
import { ADVISOR_QUESTIONS } from "../_data/advisor-questions";
import { SampleMonthBreakdown } from "./sample-month-breakdown";

export function AdvisorInsights() {
  const t = useTranslations("landing.advisor");

  return (
    <section
      id="advisor"
      aria-labelledby="advisor-heading"
      className="py-20 scroll-mt-16 sm:py-28">
      <div className="px-4 mx-auto max-w-6xl sm:px-6">
        <div className="max-w-2xl">
          <h2
            id="advisor-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {t("body")}
          </p>
        </div>
        <div className="grid gap-10 mt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SampleMonthBreakdown />
          </div>
          <dl className="divide-y divide-foreground/10">
            {ADVISOR_QUESTIONS.map(({ key, values }) => (
              <div
                key={key}
                // Hover: sorotan berbentuk kartu muncul di belakang baris, dengan kilau yang
                // menyapu dari kiri ke kanan dan halo hijau, seperti pada tombol. Teks tidak bergeser.
                className="relative py-6 first:pt-0 last:pb-0 isolate group
                  before:absolute before:-inset-x-4 before:-inset-y-3 before:-z-10 before:rounded-2xl before:content-[''] before:opacity-0
                  before:border before:border-primary/40 before:ring-4 before:ring-primary/10
                  before:bg-primary/5 before:bg-[linear-gradient(110deg,transparent_40%,color-mix(in_oklch,var(--primary)_14%,transparent)_50%,transparent_60%)] before:bg-size-[250%_100%] before:bg-position-[100%_0] before:bg-no-repeat
                  before:transition-all before:duration-500 before:ease-out
                  group-hover:before:opacity-100 group-hover:before:bg-position-[0%_0]
                  motion-reduce:before:transition-none motion-reduce:before:bg-none">
                <dt className="text-lg font-semibold transition-colors duration-300 motion-reduce:transition-none group-hover:text-primary-ink">
                  {t(`questions.${key}.question`)}
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground max-w-prose">
                  {t(`questions.${key}.answer`, values)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
