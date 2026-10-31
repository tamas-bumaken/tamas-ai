import { useTranslations } from "next-intl";
import { CHAT_MODES } from "@/constans/chat-modes";

// The real starter questions from the Advisor drawer, so the landing page shows exactly what users will see.
export function StarterQuestionsExample() {
  const t = useTranslations("chatModes.personal.suggestions");

  return (
    <ul className="flex flex-wrap gap-2">
      {CHAT_MODES.personal.suggestionKeys.map((key) => (
        <li
          key={key}
          className="px-3.5 py-2 text-sm rounded-full bg-card ring-1 ring-foreground/10"
        >
          {t(key)}
        </li>
      ))}
    </ul>
  );
}
