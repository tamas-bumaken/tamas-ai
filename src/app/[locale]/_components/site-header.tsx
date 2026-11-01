import Link from "next/link";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NAV_LINKS } from "../_data/nav-links";
import { HeaderActions } from "./header-actions";
import { SignedOutActions } from "./signed-out-actions";
import Image from "next/image";

export function SiteHeader() {
  const t = useTranslations("landing");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 shadow-xs backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex items-center justify-between h-16 gap-4 px-4 mx-auto max-w-6xl sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 text-primary-ink rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {/* The logo tilts and grows slightly when the brand is hovered */}
          <Image
            src="/logo/logo-1.png"
            alt=""
            width={30}
            height={30}
            className="object-contain size-11 rounded-xl"
          />
          <span className="text-xl font-bold ">TAMAS</span>
        </Link>
        <nav aria-label={t("header.sections")} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="group relative inline-flex items-center px-3 py-2 text-sm rounded-md text-muted-foreground outline-none transition-colors motion-reduce:transition-none hover:text-primary-ink focus-visible:ring-3 focus-visible:ring-ring/50">
                  {t(`nav.${link.key}`)}
                  {/* Underline grows from the left on hover or keyboard focus */}
                  <span
                    aria-hidden
                    className="absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-primary transition-transform duration-300 motion-reduce:transition-none scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher compact />
          <Suspense fallback={<SignedOutActions />}>
            <HeaderActions />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
