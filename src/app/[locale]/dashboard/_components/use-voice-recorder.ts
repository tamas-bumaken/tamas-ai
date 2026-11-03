"use client";

import { useEffect, useRef, useState } from "react";

// Long enough for a few transactions, short enough to stay well under the upload limit.
const MAX_RECORDING_MS = 30_000;
// A tap on the button by mistake should not reach Gemini.
const MIN_RECORDING_MS = 1_000;

export type VoiceRecorderError =
  "permissionDenied" | "unsupported" | "tooShort";

type ActiveRecording = {
  recorder: MediaRecorder;
  stream: MediaStream;
  timers: number[];
  // Set on unmount, so a recording cut off by leaving the page is never sent.
  discarded: boolean;
};

export function useVoiceRecorder({
  onRecorded,
  onError,
}: {
  onRecorded: (recording: Blob) => void;
  onError: (error: VoiceRecorderError) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const activeRef = useRef<ActiveRecording | null>(null);

  useEffect(
    () => () => {
      const active = activeRef.current;
      if (!active) return;

      active.discarded = true;
      if (active.recorder.state !== "inactive") active.recorder.stop();
    },
    [],
  );

  async function start() {
    if (activeRef.current) return;

    // getUserMedia is missing outside HTTPS and localhost, and MediaRecorder in some older browsers.
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      onError("unsupported");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const denied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "SecurityError");
      onError(denied ? "permissionDenied" : "unsupported");
      return;
    }

    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    const active: ActiveRecording = {
      recorder,
      stream,
      timers: [],
      discarded: false,
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = () => {
      // Releasing the tracks turns off the phone's microphone indicator.
      active.stream.getTracks().forEach((track) => track.stop());
      active.timers.forEach((timer) => window.clearTimeout(timer));
      activeRef.current = null;

      if (active.discarded) return;

      setIsRecording(false);
      if (Date.now() - startedAt < MIN_RECORDING_MS) {
        onError("tooShort");
        return;
      }
      onRecorded(new Blob(chunks, { type: recorder.mimeType }));
    };

    active.timers.push(
      window.setInterval(
        () => setSeconds(Math.floor((Date.now() - startedAt) / 1000)),
        250,
      ),
      window.setTimeout(stop, MAX_RECORDING_MS),
    );

    activeRef.current = active;
    setSeconds(0);
    setIsRecording(true);
    recorder.start();
  }

  function stop() {
    const recorder = activeRef.current?.recorder;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  return { isRecording, seconds, start, stop };
}
