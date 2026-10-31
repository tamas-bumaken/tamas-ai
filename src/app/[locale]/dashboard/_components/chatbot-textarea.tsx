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
import { useTranslations } from "next-intl";
import AdvisorModeSwitch from "./advisor-mode-switch";

export default function ChatbotTextarea({
  sendMessage,
  mode,
  onModeChange,
  isPending,
}: {
  sendMessage: (message: string) => void;
  // Undefined while the setting loads.
  mode: ChatMode | undefined;
  onModeChange: (next: ChatMode) => void;
  // True while an answer streams or a mode change is being saved.
  isPending: boolean;
}) {
  const t = useTranslations("advisor.composer");
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
          <AdvisorModeSwitch
            mode={mode}
            disabled={isPending}
            onChange={onModeChange}
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
