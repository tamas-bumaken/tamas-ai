import { HandCoinsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/login", key: "signIn" },
  { href: "/register", key: "createAccount" },
  { href: "/privacy", key: "privacy" },
] as const;

export function SiteFooter() {
  const t = useTranslations("landing.footer");

  return (
    <footer className="border-t">
      <div className="flex flex-col gap-6 px-4 py-10 mx-auto max-w-6xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="flex items-center gap-2 font-bold text-primary-ink">
            <HandCoinsIcon aria-hidden className="size-5" />
            TAMAS
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        <nav aria-label={t("label")}>
          <ul className="flex gap-1 text-sm">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center h-11 px-3 rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
