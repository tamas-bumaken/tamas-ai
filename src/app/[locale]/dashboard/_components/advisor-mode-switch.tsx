import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CHAT_MODES } from "@/constans/chat-modes";
import { cn } from "@/lib/utils";
import { ChatMode } from "@/validations/chatbot-validations";

const MODES = Object.keys(CHAT_MODES) as ChatMode[];

// Personal reads the user's profile and transactions, General reads neither. The choice is saved on the profile and
// the server applies it to every request, so this control only asks for a change.
export default function AdvisorModeSwitch({
  mode,
  disabled,
  onChange,
}: {
  mode: ChatMode;
  disabled: boolean;
  onChange: (next: ChatMode) => void;
}) {
  const t = useTranslations("chatModes");
  const tSwitch = useTranslations("advisor.modeSwitch");

  return (
    <div
      role="group"
      aria-label={tSwitch("label")}
      className="flex items-center p-0.5 rounded-lg bg-muted gap-0.5"
    >
      {MODES.map((option) => {
        const { Icon } = CHAT_MODES[option];
        const isActive = option === mode;

        return (
          <Button
            key={option}
            type="button"
            variant="ghost"
            size="xs"
            disabled={disabled}
            aria-pressed={isActive}
            title={t(`${option}.description`)}
            onClick={() => {
              if (!isActive) onChange(option);
            }}
            className={cn(
              "text-muted-foreground max-sm:min-h-11",
              isActive &&
                "bg-card text-foreground shadow-xs hover:bg-card disabled:opacity-100",
            )}
          >
            <Icon aria-hidden />
            {t(`${option}.name`)}
          </Button>
        );
      })}
    </div>
  );
}
