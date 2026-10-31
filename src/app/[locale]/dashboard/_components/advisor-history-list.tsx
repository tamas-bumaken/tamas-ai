"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, MessageSquareIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useFormatter, useTranslations } from "next-intl";
import {
  deleteAdvisorConversation,
  getAdvisorConversation,
  listAdvisorConversations,
} from "@/actions/advisor/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "./query-error";

export type StoredMessage = Awaited<
  ReturnType<typeof getAdvisorConversation>
>[number];

export const CONVERSATIONS_QUERY_KEY = ["advisor-conversations"];

// Saved Advisor conversations (Phase 1 / 1.8), shown in place of the chat inside the drawer.
export function AdvisorHistoryList({
  activeConversationId,
  onOpen,
  onDeleted,
}: {
  // Null before the first message of a new chat.
  activeConversationId: string | null;
  onOpen: (conversationId: string, messages: StoredMessage[]) => void;
  onDeleted: (conversationId: string) => void;
}) {
  const t = useTranslations("advisor.historyList");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const queryClient = useQueryClient();
  // Deleting takes two taps on the same row, so a stray tap cannot erase a conversation.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: () => listAdvisorConversations(),
  });

  const open = useMutation({
    mutationFn: (conversationId: string) =>
      getAdvisorConversation(conversationId),
    onSuccess: (messages, conversationId) => onOpen(conversationId, messages),
    onError: () => toast.error(t("openFailed")),
  });

  const remove = useMutation({
    mutationFn: deleteAdvisorConversation,
    onSuccess: (result, conversationId) => {
      setConfirmingId(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      onDeleted(conversationId);
    },
    onError: () => toast.error(t("deleteFailed")),
  });

  if (isPending) {
    return (
      <div aria-busy="true" aria-label={t("loading")} className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={`conversation-skeleton-${index}`}
            className="w-full h-12 motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return <QueryError message={t("loadError")} onRetry={() => refetch()} />;
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {data.map(({ id, title, updatedAt }) => {
        const isConfirming = confirmingId === id;

        return (
          <li key={id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => open.mutate(id)}
              disabled={open.isPending}
              aria-current={id === activeConversationId ? "true" : undefined}
              className="flex items-center flex-1 min-w-0 gap-3 px-3 py-2.5 text-left rounded-lg outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current]:bg-muted"
            >
              {open.isPending && open.variables === id ? (
                <Loader2Icon
                  aria-hidden
                  className="size-4 shrink-0 animate-spin"
                />
              ) : (
                <MessageSquareIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              )}
              <span className="flex-1 min-w-0 text-sm truncate">{title}</span>
              <span className="text-xs shrink-0 text-muted-foreground tabular-nums">
                {format.dateTime(new Date(updatedAt), {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </button>
            <Button
              variant={isConfirming ? "destructive" : "ghost"}
              size={isConfirming ? "sm" : "icon-sm"}
              onClick={() =>
                isConfirming ? remove.mutate(id) : setConfirmingId(id)
              }
              onBlur={() => isConfirming && setConfirmingId(null)}
              disabled={remove.isPending}
              aria-label={
                isConfirming
                  ? t("confirmDelete", { title })
                  : t("delete", { title })
              }
              className="shrink-0 max-sm:min-h-11"
            >
              {isConfirming ? tCommon("delete") : <Trash2Icon />}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
