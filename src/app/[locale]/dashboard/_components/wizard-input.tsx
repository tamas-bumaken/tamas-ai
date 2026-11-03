"use client";

import { ChangeEvent, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ChatbotForm,
  chatbotFormSchema,
} from "@/validations/chatbot-validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  CameraIcon,
  Loader2Icon,
  LogsIcon,
  MicIcon,
  SendIcon,
  SquareIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WizardProposal, WizardResult } from "@/types/wizard";
import { MAX_TRANSACTIONS_PER_MESSAGE } from "@/validations/wizard-validations";
import { compressWizardImage } from "./compress-wizard-image";
import { encodeWizardAudio } from "./encode-wizard-audio";
import { useVoiceRecorder } from "./use-voice-recorder";
import WizardConfirmDialog from "./wizard-confirm-dialog";
import { WizardDraft } from "./wizard-draft";
import WizardDraftEditDialog from "./wizard-draft-edit-dialog";
import WizardDraftsCard from "./wizard-drafts-card";

async function readWizardResponse(
  response: Response,
  // Shown when the server sends no message of its own.
  fallbackError: (status: number) => string,
): Promise<WizardResult> {
  if (!response.ok) {
    const body: { error?: string } | null = await response
      .json()
      .catch(() => null);
    throw new Error(body?.error ?? fallbackError(response.status));
  }

  return response.json();
}

// Mounted inline on the dashboard and transaction pages and inside the phone's quick log sheet.
// `onSaved` lets the sheet close once the reviewed drafts are stored.
export default function WizardInput({ onSaved }: { onSaved?: () => void }) {
  const t = useTranslations("wizard");
  const messageId = useId();
  const form = useForm<ChatbotForm>({
    resolver: zodResolver(chatbotFormSchema),
    defaultValues: {
      message: "",
    },
  });

  const [proposals, setProposals] = useState<WizardProposal[]>([]);
  const [drafts, setDrafts] = useState<WizardDraft[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Nothing is stored here: new transactions come back as drafts, changes as proposals.
  // Returns false when the review card has no room, so the caller keeps what the user typed.
  function applyResult({ drafts: newDrafts, proposals }: WizardResult) {
    // The card saves one message's worth at a time, the same cap the server enforces.
    if (drafts.length + newDrafts.length > MAX_TRANSACTIONS_PER_MESSAGE) {
      toast.error(t("tooManyDrafts", { max: MAX_TRANSACTIONS_PER_MESSAGE }));
      return false;
    }

    setDrafts((current) => [
      ...current,
      ...newDrafts.map((payload) => ({
        key: crypto.randomUUID(),
        payload,
        edited: false,
      })),
    ]);
    setProposals(proposals);
    return true;
  }

  const { mutate, isPending } = useMutation({
    mutationKey: ["wizard-input"],
    mutationFn: async (data: ChatbotForm) =>
      readWizardResponse(
        await fetch("/api/wizard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
        (status) => t("requestFailed", { status }),
      ),
    onSuccess: (result) => {
      if (applyResult(result)) form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: mutateImage, isPending: isReadingImage } = useMutation({
    mutationKey: ["wizard-image"],
    mutationFn: async (file: File) => {
      const image = await compressWizardImage(file).catch(() => {
        throw new Error(t("image.unreadable"));
      });
      const body = new FormData();
      body.set("image", image, "image.jpg");

      return readWizardResponse(
        await fetch("/api/wizard/image", { method: "POST", body }),
        (status) => t("requestFailed", { status }),
      );
    },
    // Whatever the user typed stays in the field: it has nothing to do with the image.
    onSuccess: applyResult,
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: mutateAudio, isPending: isHearingAudio } = useMutation({
    mutationKey: ["wizard-audio"],
    mutationFn: async (recording: Blob) => {
      const audio = await encodeWizardAudio(recording).catch(() => {
        throw new Error(t("voice.unreadable"));
      });
      const body = new FormData();
      body.set("audio", audio, "voice.wav");

      return readWizardResponse(
        await fetch("/api/wizard/audio", { method: "POST", body }),
        (status) => t("requestFailed", { status }),
      );
    },
    // Like an image, a recording leaves whatever the user typed in the field.
    onSuccess: applyResult,
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const voice = useVoiceRecorder({
    onRecorded: (recording) => mutateAudio(recording),
    onError: (error) => toast.error(t(`voice.${error}`)),
  });

  const isBusy = isPending || isReadingImage || isHearingAudio;
  // The microphone button stays usable while recording, since it is also the stop button.
  const isLocked = isBusy || voice.isRecording;

  function placeholder() {
    if (voice.isRecording) {
      const seconds = String(voice.seconds).padStart(2, "0");
      return t("voice.listening", { time: `0:${seconds}` });
    }
    if (isHearingAudio) return t("voice.processing");
    if (isReadingImage) return t("image.reading");
    return t("placeholder");
  }

  function onSubmit(data: ChatbotForm) {
    if (isLocked) return;

    mutate(data);
  }

  function onImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared so picking the same file again after a failure still fires this handler.
    event.target.value = "";

    if (file && !isLocked) mutateImage(file);
  }

  return (
    <Card className="w-full gap-0 border-primary/20 p-0">
      <CardContent className="pr-2">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex items-center gap-2"
        >
          <div className="text-primary">
            <LogsIcon className="size-5" />
          </div>
          <Controller
            control={form.control}
            name="message"
            render={({ field }) => (
              <Field>
                <input
                  {...field}
                  id={messageId}
                  aria-label={t("inputLabel")}
                  placeholder={placeholder()}
                  autoComplete="off"
                  disabled={isLocked}
                  // 16px on phones: iOS zooms the whole page into any field with smaller text when it gets focus.
                  className="h-12 text-base focus:outline-none md:text-sm"
                />
              </Field>
            )}
          />
          {/* No capture attribute: phones then offer both the camera and the gallery. */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onImageSelected}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isBusy}
            aria-label={voice.isRecording ? t("voice.stop") : t("voice.label")}
            aria-pressed={voice.isRecording}
            onClick={voice.isRecording ? voice.stop : voice.start}
            className="cursor-pointer shrink-0 text-primary-ink hover:text-primary-ink hover:bg-accent disabled:bg-transparent"
          >
            {isHearingAudio ? (
              <Loader2Icon className="size-5 animate-spin" />
            ) : voice.isRecording ? (
              <SquareIcon className="size-5 fill-destructive text-destructive" />
            ) : (
              <MicIcon className="size-5" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLocked}
            aria-label={t("image.label")}
            onClick={() => imageInputRef.current?.click()}
            className="cursor-pointer shrink-0 text-primary-ink hover:text-primary-ink hover:bg-accent disabled:bg-transparent"
          >
            {isReadingImage ? (
              <Loader2Icon className="size-5 animate-spin" />
            ) : (
              <CameraIcon className="size-5" />
            )}
          </Button>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            disabled={isLocked}
            aria-label={t("submit")}
            className="cursor-pointer shrink-0 text-primary-ink hover:text-primary-ink hover:bg-accent disabled:bg-transparent"
          >
            {isPending ? (
              <Loader2Icon className="size-5 animate-spin" />
            ) : (
              <SendIcon className="size-5" />
            )}
          </Button>
        </form>
      </CardContent>
      {drafts.length > 0 && (
        <WizardDraftsCard
          drafts={drafts}
          onEdit={setEditingKey}
          onRemove={(key) =>
            setDrafts((current) => current.filter((draft) => draft.key !== key))
          }
          onClear={() => setDrafts([])}
          onSaved={onSaved}
        />
      )}
      <WizardDraftEditDialog
        draft={drafts.find(({ key }) => key === editingKey) ?? null}
        onApply={(key, payload) => {
          setDrafts((current) =>
            current.map((draft) =>
              draft.key === key
                ? {
                    key,
                    payload,
                    edited:
                      draft.edited ||
                      JSON.stringify(draft.payload) !== JSON.stringify(payload),
                  }
                : draft,
            ),
          );
          setEditingKey(null);
        }}
        onClose={() => setEditingKey(null)}
      />
      <WizardConfirmDialog
        proposals={proposals}
        onClose={() => setProposals([])}
      />
    </Card>
  );
}
