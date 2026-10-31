import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="flex flex-col items-center justify-center flex-1 min-h-screen gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <Button asChild variant="outline">
        <Link href="/">{t("home")}</Link>
      </Button>
    </main>
  );
}
