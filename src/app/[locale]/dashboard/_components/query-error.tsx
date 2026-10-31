import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function QueryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const t = useTranslations("common");

  return (
    <div
      role="alert"
      className="flex flex-col items-start p-4 text-sm border rounded-lg gap-3 border-destructive/50 bg-destructive/10 text-destructive"
    >
      <p>{message}</p>
      <Button
        variant="outline"
        size="sm"
        className="h-11 text-foreground md:h-8"
        onClick={onRetry}
      >
        {t("tryAgain")}
      </Button>
    </div>
  );
}
