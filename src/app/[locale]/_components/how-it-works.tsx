import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  HOW_IT_WORKS_STEPS,
  HowItWorksExample,
} from "../_data/how-it-works-steps";
import { SAVINGS_TARGET_PERCENT } from "../_data/sample-month";
import { QuickEntryExample } from "./quick-entry-example";
import { SavingsExample } from "./savings-example";
import { StarterQuestionsExample } from "./starter-questions-example";

const EXAMPLES: Record<HowItWorksExample, ReactNode> = {
  "quick-entry": <QuickEntryExample />,
  savings: <SavingsExample />,
  "starter-questions": <StarterQuestionsExample />,
};

export function HowItWorks() {
  const t = useTranslations("landing.howItWorks");

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="py-20 scroll-mt-16 bg-muted/50 sm:py-28"
    >
      <div className="px-4 mx-auto max-w-6xl sm:px-6">
        <div className="max-w-2xl">
          <h2
            id="how-it-works-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {t("body")}
          </p>
        </div>
        <ol className="mt-14 divide-y divide-foreground/10 border-y border-foreground/10">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <li
              key={step.key}
              className="grid gap-6 py-10 lg:grid-cols-[1fr_1fr] lg:gap-16"
            >
              <div className="flex gap-4">
                <span
                  aria-hidden
                  className="flex items-center justify-center text-sm font-semibold rounded-full size-8 shrink-0 bg-primary text-primary-foreground tabular-nums"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-semibold">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-muted-foreground max-w-prose">
                    {t(`steps.${step.key}.body`, {
                      target: SAVINGS_TARGET_PERCENT,
                    })}
                  </p>
                </div>
              </div>
              <div className="lg:pt-1">{EXAMPLES[step.example]}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
