"use client";

import { useState } from "react";
import { MessageCircleQuestionIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { FAQ_KEYS } from "../_data/faqs";

export function Faq() {
  const t = useTranslations("landing.faq");
  // Satu pertanyaan terbuka dalam satu waktu, yang pertama terbuka sejak awal.
  const [openKey, setOpenKey] = useState<string | null>(FAQ_KEYS[0] ?? null);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-20 scroll-mt-16 sm:py-28">
      <div className="grid gap-10 px-4 mx-auto max-w-6xl sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        {/* Judul ikut menempel saat daftar pertanyaan di-scroll (layar lebar) */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <span
            aria-hidden
            className="flex items-center justify-center size-12 rounded-2xl bg-primary/10">
            <MessageCircleQuestionIcon className="size-6 text-primary-ink" />
          </span>
          <h2
            id="faq-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="divide-y divide-foreground/10 border-y border-foreground/10">
          {FAQ_KEYS.map((key) => {
            const isOpen = openKey === key;

            return (
              <div key={key} className="relative group">
                {/* Garis aksen di kiri: muncul saat hover, penuh saat terbuka */}
                <span
                  aria-hidden
                  className={`absolute left-0 inset-y-4 w-1 rounded-full bg-primary transition-transform duration-300 motion-reduce:transition-none ${
                    isOpen ? "scale-y-100" : "scale-y-0 group-hover:scale-y-50"
                  }`}
                />

                <h3>
                  <button
                    type="button"
                    id={`faq-q-${key}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${key}`}
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    className="flex items-center justify-between w-full gap-4 py-5 text-lg font-medium text-left rounded-md cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    <span
                      className={`transition-all duration-300 motion-reduce:transition-none ${
                        isOpen
                          ? "translate-x-4 text-primary-ink"
                          : "group-hover:translate-x-2"
                      }`}>
                      {t(`items.${key}.question`)}
                    </span>
                    <span
                      aria-hidden
                      className={`flex items-center justify-center shrink-0 size-8 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                        isOpen
                          ? "rotate-45 bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary-ink"
                      }`}>
                      <PlusIcon className="size-4" />
                    </span>
                  </button>
                </h3>

                {/* Jawaban membuka dengan transisi tinggi dan fade */}
                <div
                  id={`faq-a-${key}`}
                  role="region"
                  aria-labelledby={`faq-q-${key}`}
                  aria-hidden={!isOpen}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}>
                  <div className="overflow-hidden">
                    <p className="pb-5 pl-4 pr-9 text-base leading-7 text-muted-foreground max-w-prose">
                      {t(`items.${key}.answer`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
