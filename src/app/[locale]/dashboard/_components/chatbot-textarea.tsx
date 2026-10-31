import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ChatbotForm,
  chatbotFormSchema,
  ChatMode,
} from "@/validations/chatbot-validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field } from "@/components/ui/field";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KeyboardEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CHAT_MODES } from "@/constans/chat-modes";
import { useAdvisorDrawer } from "./advisor-drawer-context";

// Says whether the advisor reads the user's data, and links to the Profile setting that changes it.
function AdvisorDataNote({
  mode,
  onNavigate,
}: {
  mode: ChatMode;
  onNavigate: () => void;
}) {
  const t = useTranslations("chatModes");
  const { Icon } = CHAT_MODES[mode];

  return (
    <Link
      href="/dashboard/profile#advisor-data"
      onClick={onNavigate}
      className="flex items-center gap-1.5 px-2 text-xs rounded-md outline-none text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 max-sm:min-h-11"
    >
      <Icon aria-hidden className="size-3.5" />
      {t(`${mode}.description`)}
    </Link>
  );
}

export default function ChatbotTextarea({
  sendMessage,
  mode,
  isPending,
}: {
  sendMessage: (message: string) => void;
  // Undefined while the setting loads.
  mode: ChatMode | undefined;
  isPending: boolean;
}) {
  const t = useTranslations("advisor.composer");
  const advisor = useAdvisorDrawer();
  const form = useForm<ChatbotForm>({
    resolver: zodResolver(chatbotFormSchema),
    defaultValues: {
      message: "",
    },
  });
  const message = useWatch({ control: form.control, name: "message" });
  const canSend = !isPending && message.trim().length > 0;

  function onSubmit(data: ChatbotForm) {
    // A second message mid-stream would receive the chunks of the first one.
    if (isPending) return;

    sendMessage(data.message);
    form.reset();
  }

  function hendleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-1 p-2 border rounded-2xl bg-background shadow-xs transition-[box-shadow,border-color] focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20"
    >
      <Controller
        control={form.control}
        name="message"
        render={({ field }) => (
          <Field>
            <textarea
              {...field}
              id="form-message"
              aria-label={t("label")}
              placeholder={t("placeholder")}
              autoComplete="off"
              rows={1}
              onKeyDown={hendleKeyDown}
              // Grows with the text up to a cap, then scrolls; no JS measuring needed.
              className="w-full px-2 pt-1.5 text-base resize-none field-sizing-content min-h-12 max-h-40 bg-transparent placeholder:text-muted-foreground focus:outline-none"
            ></textarea>
          </Field>
        )}
      />
      <div className="flex items-center justify-between gap-2">
        {mode ? (
          <AdvisorDataNote
            mode={mode}
            onNavigate={() => advisor.setIsOpen(false)}
          />
        ) : (
          <span />
        )}
        <Button
          type="submit"
          size="icon-sm"
          disabled={!canSend}
          aria-label={t("send")}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/85 max-sm:size-11"
        >
          <ArrowUpIcon />
        </Button>
      </div>
    </form>
  );
}
