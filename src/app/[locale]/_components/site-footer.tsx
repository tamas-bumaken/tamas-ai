import Image from "next/image";
import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getCurrentYearInJakarta } from "@/lib/dates";

const FOOTER_LINKS = [
  { href: "/login", key: "signIn" },
  { href: "/register", key: "createAccount" },
  { href: "/privacy", key: "privacy" },
] as const;

// Cached so the landing page stays prerendered: reading the clock during render would make it dynamic.
// The year can lag a few hours after New Year's Eve, which no visitor will notice.
async function getFooterYear() {
  "use cache";
  cacheLife("hours");

  return getCurrentYearInJakarta();
}

export async function SiteFooter() {
  const [t, year] = await Promise.all([
    getTranslations("landing.footer"),
    getFooterYear(),
  ]);

  return (
    <footer className="border-t bg-muted/40">
      <div className="px-4 py-10 mx-auto max-w-6xl sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/logo-1.png"
              alt=""
              width={44}
              height={44}
              className="object-contain size-11 rounded-xl"
            />
            <div>
              <p className="text-lg font-bold leading-none text-primary-ink">
                TAMAS
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("tagline")}
              </p>
            </div>
          </div>

          <nav aria-label={t("label")}>
            <ul className="flex flex-wrap gap-1 text-sm">
              {FOOTER_LINKS.map((link) => {
                const isPrimary = link.href === "/register";

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`group relative inline-flex items-center h-11 px-3 rounded-md outline-none transition-colors motion-reduce:transition-none hover:text-primary-ink focus-visible:ring-3 focus-visible:ring-ring/50 ${
                        isPrimary
                          ? "font-semibold text-primary-ink"
                          : "text-muted-foreground"
                      }`}
                    >
                      {t(link.key)}
                      {/* Garis bawah tumbuh dari kiri saat hover atau fokus */}
                      <span
                        aria-hidden
                        className="absolute inset-x-3 bottom-2.5 h-0.5 origin-left rounded-full bg-primary transition-transform duration-300 motion-reduce:transition-none scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <p className="pt-8 mt-8 text-xs border-t border-foreground/10 text-muted-foreground">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
