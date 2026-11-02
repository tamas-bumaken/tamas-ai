"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { BotIcon, HistoryIcon, SquarePenIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  getAdvisorMode,
  setAdvisorUsesPersonalData,
} from "@/actions/advisor/actions";
import ChatbotTextarea from "./chatbot-textarea";
import ChatMessageItem from "./chat-message";
import { ChatMessage, ChatMessagePart, ChatStreamEvent } from "@/types/chat";
import {
  ChatMode,
  ChatRequest,
  MAX_CHAT_HISTORY_MESSAGES,
} from "@/validations/chatbot-validations";
import { CHAT_MODES } from "@/constans/chat-modes";
import { useAdvisorDrawer } from "./advisor-drawer-context";
import {
  AdvisorHistoryList,
  CONVERSATIONS_QUERY_KEY,
  StoredMessage,
} from "./advisor-history-list";

// A rate limit or daily quota rejection, whose server message is shown as-is.
class ChatLimitError extends Error {}

// Thoughts and errors are UI-only; resending them would make the model treat them as its own replies.
function toHistory(messages: ChatMessage[]): ChatRequest["messages"] {
  const history = messages
    .map(({ role, parts }) => ({
      role,
      text: parts
        .filter((part) => !part.error)
        .map((part) => part.text)
        .join(""),
    }))
    .filter(({ text }) => text.trim().length > 0)
    .slice(-MAX_CHAT_HISTORY_MESSAGES);

  // Trimming can leave a model turn first; keep the history starting on a user turn.
  return history[0]?.role === "model" ? history.slice(1) : history;
}

export default function ChatbotDrawer() {
  const chatRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const t = useTranslations("advisor");
  const tModes = useTranslations("chatModes");
  const queryClient = useQueryClient();
  const [conversation, setConversetion] = useState<ChatMessage[]>([]);
  // The server saves each finished answer under this id (Phase 1 / 1.8). Created on the first message, not on render:
  // the page is prerendered, and Cache Components rejects random values during render.
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [view, setView] = useState<"chat" | "history">("chat");
  // The server applies the saved mode to every request; this copy only drives the switch, suggestions and description.
  const { data: savedMode } = useQuery({
    queryKey: ["advisor-mode"],
    queryFn: () => getAdvisorMode(),
  });
  const [isPending, setIsPending] = useState<boolean>(false);
  const { isOpen, setIsOpen, pendingMessage, setPendingMessage } =
    useAdvisorDrawer();

  // When something outside the drawer (for example an AI suggestion card) asks the
  // advisor to open with a prefilled message, send it as soon as the drawer is visible.
  useEffect(() => {
    if (!isOpen || !pendingMessage) return;
    sendMessage(pendingMessage);
    setPendingMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingMessage]);

  const {
    mutate: changeMode,
    isPending: isSavingMode,
    variables: requestedMode,
  } = useMutation({
    mutationFn: (next: ChatMode) =>
      setAdvisorUsesPersonalData(next === "personal"),
    onSuccess: (result, next) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      queryClient.setQueryData(["advisor-mode"], next);

      if (next === "personal") {
        toast.success(t("modeSwitch.personalOn"));
      } else if (conversation.length > 0) {
        // The chat is resent with every message, so its figures would reach the model after the user turned data off.
        startNewChat();
        toast.success(t("modeSwitch.generalOnNewChat"));
      } else {
        toast.success(t("modeSwitch.generalOn"));
      }
    },
    onError: () => {
      toast.error(t("modeSwitch.saveFailed"));
    },
  });
  const mode = isSavingMode ? requestedMode : savedMode;

  useEffect(() => () => abortRef.current?.abort(), []);

  function appendToLastModelMessage(part: ChatMessagePart) {
    setConversetion((prev) => {
      const last = prev.at(-1);
      if (!last || last.role !== "model") return prev;

      const parts = [...last.parts];
      const lastPart = parts.at(-1);

      // Merge consecutive chunks of the same kind so one answer renders as one block.
      if (lastPart && Boolean(lastPart.error) === Boolean(part.error)) {
        parts[parts.length - 1] = {
          ...lastPart,
          text: lastPart.text + part.text,
        };
      } else {
        parts.push(part);
      }

      return [...prev.slice(0, -1), { ...last, parts }];
    });
  }

  function handleStreamEvent(event: ChatStreamEvent) {
    if (event.type === "error") {
      appendToLastModelMessage({
        text: t("streamErrorSuffix", { message: event.message }),
        error: true,
      });
    } else {
      appendToLastModelMessage({ text: event.text });
    }
  }

  async function streamResponse(
    messages: ChatRequest["messages"],
    conversationId: string,
    signal: AbortSignal,
  ) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, conversationId } satisfies ChatRequest),
      signal,
    });

    if (!response.ok || !response.body) {
      const body: { error?: string } | null = await response
        .json()
        .catch(() => null);
      // Limit errors explain themselves; only unexpected failures get the generic wrapper below.
      if (response.status === 429 && body?.error) {
        throw new ChatLimitError(body.error);
      }
      throw new Error(
        body?.error ?? t("requestFailed", { status: response.status }),
      );
    }

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += value;
      const lines = buffer.split("\n");
      // The last line may be an incomplete JSON object; keep it for the next read.
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line) handleStreamEvent(JSON.parse(line) as ChatStreamEvent);
      }
    }
  }

  async function sendMessage(message: string) {
    // While a mode change saves, the server could still answer in the mode the user just left.
    if (isPending || isSavingMode) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: message }],
    };
    const history = toHistory([...conversation, userMessage]);
    const activeConversationId = conversationId ?? crypto.randomUUID();
    setConversationId(activeConversationId);

    setConversetion((prev) => [
      ...prev,
      userMessage,
      { role: "model", parts: [], mode },
    ]);
    setIsPending(true);

    try {
      await streamResponse(history, activeConversationId, controller.signal);
    } catch (error) {
      if (controller.signal.aborted) return;

      appendToLastModelMessage({
        text:
          error instanceof ChatLimitError
            ? error.message
            : t("unreachable", {
                reason:
                  error instanceof Error ? error.message : t("unknownError"),
              }),
        error: true,
      });
    } finally {
      setIsPending(false);
      // A finished answer adds or reorders a saved conversation.
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    }
  }

  function startNewChat() {
    abortRef.current?.abort();
    setConversetion([]);
    setConversationId(null);
    setView("chat");
  }

  function openConversation(id: string, messages: StoredMessage[]) {
    abortRef.current?.abort();
    setConversetion(
      messages.map(({ role, text, mode }) => ({
        role,
        parts: [{ text }],
        mode: mode ?? undefined,
      })),
    );
    setConversationId(id);
    setView("chat");
  }

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [conversation]);

  // Sent as-is when tapped, so they are in the UI language.
  const suggestions = mode
    ? CHAT_MODES[mode].suggestionKeys.map((key) =>
        tModes(`${mode}.suggestions.${key}`),
      )
    : [];

  return (
    <Drawer
      direction="right"
      modal={false}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      {/* Phones open the Advisor from the bottom navigation instead. */}
      <DrawerTrigger className="fixed bottom-4 right-4 max-md:hidden" asChild>
        <Button
          className="rounded-full shadow-sm size-14"
          size="icon-lg"
          variant="outline"
          aria-label={t("open")}
        >
          <BotIcon className="size-6 text-primary-ink" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-md">
        <DrawerHeader className="flex flex-row items-center justify-between gap-2 px-4 py-3 border-b">
          <div className="min-w-0">
            <DrawerTitle className="text-base font-semibold">
              AI Advisor
            </DrawerTitle>
            <DrawerDescription className="truncate">
              {mode ? tModes(`${mode}.description`) : t("defaultDescription")}
            </DrawerDescription>
          </div>
          <div className="flex items-center shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setView(view === "history" ? "chat" : "history")}
              aria-label={t("history")}
              aria-pressed={view === "history"}
              title={t("history")}
              className="text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
            >
              <HistoryIcon />
            </Button>
            {(conversation.length > 0 || view === "history") && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={startNewChat}
                aria-label={t("newChat")}
                title={t("newChatTitle")}
                className="text-muted-foreground"
              >
                <SquarePenIcon />
              </Button>
            )}
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("close")}
                className="text-muted-foreground"
              >
                <XIcon />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div
          ref={chatRef}
          className="flex-1 min-h-0 px-4 py-5 overflow-x-hidden overflow-y-auto"
        >
          {view === "history" ? (
            <AdvisorHistoryList
              activeConversationId={conversationId}
              onOpen={openConversation}
              onDeleted={(id) => {
                // The chat on screen no longer exists in the history, so it starts over.
                if (id === conversationId) startNewChat();
              }}
            />
          ) : conversation.length > 0 ? (
            <div className="flex flex-col gap-6">
              {conversation.map((message, index) => (
                <ChatMessageItem
                  key={`conversation-${index}`}
                  message={message}
                  isStreaming={isPending && index === conversation.length - 1}
                />
              ))}
            </div>
          ) : (
            // Bottom-aligned so the suggestions sit right above the composer they feed.
            <div className="flex flex-col justify-end h-full gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("emptyBody")}
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => sendMessage(suggestion)}
                      className="w-full px-3 py-2.5 text-sm text-left border rounded-xl transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* The composer belongs to the chat; in the history list a message would land in a hidden conversation. */}
        {view === "chat" && (
          <DrawerFooter className="pt-2">
            <ChatbotTextarea
              mode={mode}
              onModeChange={changeMode}
              sendMessage={sendMessage}
              isPending={isPending || isSavingMode}
            />
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
