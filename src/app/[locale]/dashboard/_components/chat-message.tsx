import { ChatMessage } from "@/types/chat";
import AdvisorFeedback from "./advisor-feedback";
import { BotIcon } from "lucide-react";
import Markdown from "react-markdown";
import { useTranslations } from "next-intl";

function TypingIndicator() {
  const t = useTranslations("advisor");

  return (
    <div role="status" className="flex items-center h-7 gap-1">
      <span className="sr-only">{t("typing")}</span>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          aria-hidden
          style={{ animationDelay: `${delay}ms` }}
          className="rounded-full size-1.5 bg-primary-ink/60 motion-safe:animate-pulse"
        />
      ))}
    </div>
  );
}

export default function ChatMessageItem({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  isStreaming: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="self-end max-w-[85%] px-4 py-2.5 text-base text-primary-foreground break-words whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary">
        {message.parts[0]?.text}
      </div>
    );
  }

  // The model can take a moment before the first answer text, so the indicator stays until it arrives.
  const hasAnswer = message.parts.some((part) => part.text.trim().length > 0);
  // Only finished, successful answers are rated; an error is not the advisor's answer.
  const canRate =
    !isStreaming && hasAnswer && !message.parts.some((part) => part.error);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-primary-ink">
        <BotIcon className="size-4" />
        AI Advisor
      </div>
      {message.parts.map((part, index) => {
        if (part.error) {
          return (
            <p key={index} role="alert" className="text-sm text-destructive">
              {part.text}
            </p>
          );
        }

        return (
          <div key={index} className="text-base leading-7 response-ai">
            <Markdown>{part.text}</Markdown>
          </div>
        );
      })}
      {isStreaming && !hasAnswer && <TypingIndicator />}
      {canRate && message.mode && <AdvisorFeedback mode={message.mode} />}
    </div>
  );
}
