import { useTranslations } from "next-intl";
import { ADVISOR_QUESTIONS } from "../_data/advisor-questions";
import { SampleMonthBreakdown } from "./sample-month-breakdown";

export function AdvisorInsights() {
  const t = useTranslations("landing.advisor");

  return (
    <section
      id="advisor"
      aria-labelledby="advisor-heading"
      className="py-20 scroll-mt-16 sm:py-28"
    >
      <div className="px-4 mx-auto max-w-6xl sm:px-6">
        <div className="max-w-2xl">
          <h2
            id="advisor-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
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
              <div key={key} className="py-6 first:pt-0 last:pb-0">
                <dt className="text-lg font-semibold">
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
