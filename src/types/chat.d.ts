import { ChatMode } from "@/validations/chatbot-validations";

export type ChatStreamEvent =
  { type: "answer"; text: string } | { type: "error"; message: string };

export type ChatMessagePart = {
  text: string;
  // Error parts are shown to the user but never sent back to the model as history.
  error?: boolean;
};

export type ChatMessage = {
  role: "user" | "model";
  parts: ChatMessagePart[];
  // The mode an answer was given in (the Profile data access setting at that moment), reported with its feedback.
  mode?: ChatMode;
};
