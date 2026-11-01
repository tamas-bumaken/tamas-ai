import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SignedOutActions() {
  const t = useTranslations("landing.header");

  return (
    <>
      <Button asChild variant="ghost" className="h-11 px-3 text-base sm:h-10">
        <Link href="/login">{t("signIn")}</Link>
      </Button>
      <Button asChild className="h-11 px-4 text-base sm:h-10">
        <Link href="/register">
          {/* The full label does not fit next to the logo on a 360px screen. */}
          <span className="sm:hidden">{t("signUp")}</span>
          <span className="hidden sm:inline">{t("createAccount")}</span>
        </Link>
      </Button>
    </>
  );
}
